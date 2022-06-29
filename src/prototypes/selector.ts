export function registerSelectorProtos() {
    data.extend([
        {
            name: "os-satellite-targetting",
            type: "selection-tool",
            flags: ["hidden", "not-stackable", "only-in-cursor", "spawnable"],
            selection_color: [0.7, 0.7, 0.7],
            alt_selection_color: [0.8, 0.5, 0.5],
            selection_mode: ["nothing"],
            alt_selection_mode: ["nothing"],
            selection_cursor_box_type: "entity",
            alt_selection_cursor_box_type: "entity",
            stack_size: 1,
            icons: [
                {
                    icon: "__base__/graphics/icons/radar.png",
                    icon_size: 64,
                    scale: 0.25,
                    tint: {r: 0.761, g: 0.9451, b:1},
                    icon_mipmaps: 4,
                    shift: [2, 3],
                },
                {
                    icon: "__base__/graphics/icons/satellite.png",
                    icon_size: 64,
                    scale: 0.2,
                    shift: [10, 12],
                    icon_mipmaps: 4,
                }
            ]
        },
        {
            name: "os-satellite-targetting-shortcut",
            type: "shortcut",
            action: "spawn-item",
            item_to_spawn: "os-satellite-targetting",
            associated_control_input: "os-satellite-input",
            technology_to_unlock: "os-orbital-scanning",
            icon: {
                filename: "__base__/graphics/icons/satellite.png",
                priority: "extra-high-no-scale",
                size: 64,
                scale: 0.25,
                mipmap_count: 4,
                flags: ["gui-icon"]
            }
        },
        {
            name: "os-satellite-input",
            type: "custom-input",
            action: "spawn-item",
            item_to_spawn: "os-satellite-targetting",
            key_sequence: "CONTROL + U",
        }
    ]);
}