
type DesignatedBox = {
  box: BoundingBox,
  chunk_area: number
}

class OSForceSurface {
  areas: DesignatedBox[] = [];
  allocated_chunks: number = 0;
  satellites: number = 0;
  allowed_chunks: number = 0;
}

class OSForceData {
  surface_specific: LuaTable<string, OSForceSurface> = new LuaTable();
}

type InterBox = {
  left: number,
  right: number,
  top: number,
  bottom: number,
}

function normalizeBox(box: any): BoundingBox {
  let keys = Object.keys(box);
  if (!keys.includes("left_top") || !keys.includes("right_bottom")) {
    let left_top = (box as unknown as Array<unknown>)[1];
    let right_bottom = (box as unknown as Array<unknown>)[2];
    return { left_top: normalizePosition(left_top as Object), right_bottom: normalizePosition(right_bottom as Object), orientation: undefined }
  } else {
    box.left_top = normalizePosition(box["left_top"]);
    box.right_bottom = normalizePosition(box["right_bottom"]);
    return box;
  }

}

function normalizePosition(position: any): Position {
  let keys = Object.keys(position);
  if (!keys.includes("x") || !keys.includes("y")) {
    return { x: position[1], y: position[2] };
  }
  return position;
}

function convertBox(box: BoundingBox): InterBox {
  box = normalizeBox(box);
  return { left: box.left_top.x, right: box.right_bottom.x, top: box.left_top.y, bottom: box.right_bottom.y };
}

function doBoxesIntersect(abb: BoundingBox, bbb: BoundingBox): boolean {
  let r1 = convertBox(abb);
  let r2 = convertBox(bbb);
  // shamelessly stolen from stackexchange
  // to be fair is fairly simple
  let result = !(r2.left > r1.right
    || r2.right < r1.left
    || r2.top > r1.bottom
    || r2.bottom < r1.top);
  return result;
}

declare namespace global {
  let forcedata: LuaTable<string, OSForceData>;
}

function onTick(event: any) {
  if (event.tick % 60 == 0) {
    for (const [forcename, forcedata] of pairs(global.forcedata)) {
      const force = game.forces.get(forcename);
      for (const [surface_name, ossurf] of pairs(forcedata.surface_specific)) {
        for (const chart_area of ossurf.areas) {
          force.chart(surface_name, chart_area.box);
        }
      }
    }
  }
}

function onSelectedArea(event: OnPlayerSelectedAreaPayload, remove: boolean = false) {
  if (event.item == "os-satellite-targetting") {
    let player = game.players[event.player_index];
    let force = player.force as LuaForce;
    let sdata = getSurfaceDataForForce(force.name, event.surface.name);
    let area = getChunkArea(event.area);
    if (!remove) {
      if (sdata.allowed_chunks - sdata.allocated_chunks >= area) {
        player.print(["orbital-scanner.selected-success", area, sdata.allowed_chunks, sdata.allocated_chunks + area]);
        rawAddZone(force.name, event.surface.name, event.area);
        sdata.allocated_chunks += area;
      } else {
        player.print(["orbital-scanner.selected-error", area, sdata.allocated_chunks, sdata.allowed_chunks]);
      }
    } else {
      let result = rawRemoveZone(force.name, event.surface.name, event.area);
      sdata.allocated_chunks -= result.total_area;
      player.print(["orbital-scanner.removal", result.total_area, result.zones, sdata.allocated_chunks, sdata.allowed_chunks]);
    }
  }
}

function onRocketLaunched(event: OnRocketLaunchedPayload) {
  let force = event.rocket.force as LuaForce;
  let surface = event.rocket.surface as LuaSurface;
  let inventory = event.rocket.get_inventory(defines.inventory.rocket);
  let satcount = inventory!.get_contents()!["os-scanning-satellite"];
  if (satcount != null && satcount > 0) {
    launchSatellite(force.name, surface.name);
  }
}

script.on_event(defines.events.on_tick, onTick);
script.on_event(defines.events.on_player_selected_area, onSelectedArea);
script.on_event(defines.events.on_player_alt_selected_area, (evt) => onSelectedArea(evt, true));
script.on_event(defines.events.on_rocket_launched, onRocketLaunched);

script.on_init(() => {
  global.forcedata = new LuaTable<string | number, OSForceData>();
  for (const [name, force] of pairs(game.forces)) {
    global.forcedata.set(name as string, new OSForceData());
  }
});

function getForceData(force: string): OSForceData {
  let forcedata = global.forcedata.get(force);
  if (forcedata) { return forcedata; }
  else {
    let ndata = new OSForceData();
    global.forcedata.set(force, ndata);
    return ndata;
  }
}

function getSurfaceDataForForce(force: string, surface: string): OSForceSurface {
  let forcedata = getForceData(force);
  if (forcedata.surface_specific.has(surface)) {
    return forcedata.surface_specific.get(surface);
  } else {
    let fs = new OSForceSurface();
    forcedata.surface_specific.set(surface, fs);
    return fs;

  }
}

function getChunkArea(zone: BoundingBox): number {
  let chunk_lt_x = math.floor(zone.left_top.x / 32)
  let chunk_lt_y = math.floor(zone.left_top.y / 32)
  let chunk_rb_x = math.floor(zone.right_bottom.x / 32)
  let chunk_rb_y = math.floor(zone.right_bottom.y / 32)
  let chunk_width = math.max(chunk_rb_x - chunk_lt_x + 1, 1);
  let chunk_height = math.max(chunk_rb_y - chunk_lt_y + 1, 1);
  return chunk_width * chunk_height;
}

function rawAddZone(force: string, surface: string, zone: BoundingBox) {
  getSurfaceDataForForce(force, surface).areas.push({box: zone, chunk_area: getChunkArea(zone)});
  game.forces.get(force).chart(game.get_surface(surface), zone);
}

function rawRemoveZone(force: string, surface: string, zone: BoundingBox): RemoveResult {
  let removedAreas = getSurfaceDataForForce(force, surface).areas.filter((box) => doBoxesIntersect(box.box, zone));
  let total_area = removedAreas.reduce((prev, cur) => prev + cur.chunk_area, 0);
  let count = removedAreas.length;
  let remaining = getSurfaceDataForForce(force, surface).areas
    .filter((box) => !doBoxesIntersect(box.box, zone))
    .reduce((prev, cur) => { prev.push(cur); return prev; }, [] as DesignatedBox[]);

  global.forcedata.get(force).surface_specific.get(surface).areas = remaining;
  return {total_area: total_area, zones: count};
}

type RemoveResult = {
  total_area: number,
  zones: number,
}

function refreshSatelliteChunkCapacity(force: string, surface: string) {
  let data = getSurfaceDataForForce(force, surface);
  let cps = getChunksPerSatellite();
  data.allowed_chunks = data.satellites * cps;
}

function setAllocatedChunks(force: string, surface: string, allocated: number) {
  getSurfaceDataForForce(force, surface).allocated_chunks = allocated;
}

function setAllowedChunks(force: string, surface: string, allowed_chunks: number) {
  getSurfaceDataForForce(force, surface).allowed_chunks = allowed_chunks;
}

function getAllocatedChunks(force: string, surface: string): number {
  return getSurfaceDataForForce(force, surface).allocated_chunks;
}

function getAllowedChunks(force: string, surface: string): number {
  return getSurfaceDataForForce(force, surface).allowed_chunks;
}

function setLaunchedSatellites(force: string, surface: string, satellites: number) {
  getSurfaceDataForForce(force, surface).satellites = satellites;
  refreshSatelliteChunkCapacity(force, surface);
}

function getLaunchedSatellites(force: string, surface: string): number {
  return getSurfaceDataForForce(force, surface).satellites;
}

function launchSatellite(force: string, surface: string) {
  setLaunchedSatellites(force, surface, getLaunchedSatellites(force, surface) + 1);
  
  let luaforce = game.forces.get(force);
  let fdata = getSurfaceDataForForce(force, surface);
  luaforce.print(["orbital-scanner.launched", getChunksPerSatellite(), fdata.allocated_chunks, fdata.allowed_chunks, surface]);
}

function getChunksPerSatellite(): number {
  return settings.global["os-chunks-per-satellite"].value as number;
}

remote.add_interface("orbital-scanner", {
  add_zone: rawAddZone,
  remove_zone: rawRemoveZone,
  set_allocated_chunks: setAllocatedChunks,
  set_allowed_chunks: setAllowedChunks,
  get_allocated_chunks: getAllocatedChunks,
  get_allowed_chunks: getAllowedChunks,
  reset_force_surface: (force: string, surface: string) => { global.forcedata.get(force).surface_specific.delete(surface); },
  reset_force: (force: string) => { global.forcedata.delete(force); },
  reset: () => {global.forcedata = new LuaTable();},
  set_launched_scanning_satellites: setLaunchedSatellites,
  get_launched_scanning_satellites: getLaunchedSatellites,
  launch_satellite: launchSatellite,
  refresh_force_surface: refreshSatelliteChunkCapacity,
});


