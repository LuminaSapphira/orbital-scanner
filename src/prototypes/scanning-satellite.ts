function transformIngredients(ingredients: any[]): any[] {
    let init: any[] = [];
    let result = ingredients.map((ingred) => {
        log("ingred: " + serpent.line(ingred));
        let out = {name: ingred[1], amount: ingred[2]};
        if (out.name == "processing-unit") {
            out.amount *= 2
        }
        else if (out.name == "radar") {
            out.amount *= 20
        }
        return out;
    }).reduce((prev, current) => { prev.push(current); return prev; }, init);
    return result;
}

export function registerSatelliteProtos() {

    // item
    let satellite_item = table.deepcopy(data.raw["item"]["satellite"]);
    satellite_item.name = "os-scanning-satellite";
    satellite_item.order = "mm[scanning-satellite]"
    satellite_item.rocket_launch_product = null;
    satellite_item.rocket_launch_products = null;
    satellite_item.icon_size = null;
    satellite_item.icon = null;
    satellite_item.icons = [
        {
            icon: "__base__/graphics/icons/satellite.png",
            icon_size: 64,
            tint: {r: 0.4, g: 0.6, b:1},
        }
    ];

    // recipe
    let satellite_recipe = table.deepcopy(data.raw["recipe"]["satellite"]);
    satellite_recipe.name = "os-scanning-satellite";
    satellite_recipe.result = "os-scanning-satellite";
    satellite_recipe.results = null;
    satellite_recipe.main_product = satellite_recipe.result;
    satellite_recipe.order = "mm[scanning-satellite]"
    satellite_recipe.ingredients = transformIngredients(satellite_recipe.ingredients);
    data.extend([
        // item
        satellite_item,
        //recipe
        satellite_recipe,
        // technology
        {
            name: "os-orbital-scanning",
            type: "technology",
            prerequisites: ["rocket-silo"],
            unit: {
                count: 1000,
                time: 60,
                ingredients: [
                    ["automation-science-pack", 1],
                    ["logistic-science-pack", 1],
                    ["chemical-science-pack", 1],
                    ["production-science-pack", 1],
                    ["utility-science-pack", 1],
                ]
            },
            effects: [
                {
                    type: "unlock-recipe",
                    recipe: "os-scanning-satellite"
                }
            ],
            icons: [
                {
                    icon: "__base__/graphics/technology/rocket-silo.png",
                    icon_size: 256,
                },
                {
                    icon: "__orbital-scanner__/graphics/technology/satellite-radar.png",
                    icon_size: 256,
                    scale: 0.5,
                    shift: [-60, 100]
                },
                {
                    icon: "__base__/graphics/icons/satellite.png",
                    icon_size: 64,
                    scale: 2,
                    shift: [80, 100]
                }
            ]
        }
    ])
}