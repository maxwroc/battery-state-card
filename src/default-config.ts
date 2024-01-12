export default <IBatteryStateCardConfig>{
    sort: {
        by: "state"
    },
    collapse: 8,
    filter: {
        include: [{
            name: "attributes.device_class",
            value: "battery"
        }],
        exclude: [{
            name: "entity_id",
            value: "binary_sensor.*"
        }]
    },
    secondary_info: "{last_changed}",
    bulk_rename: [
        { from: " Battery" },
        { from: " level" },
    ],
    colors: {
        steps: [ "#ff0000", "#ffff00", "#00ff00" ],
        gradient: true,
    }
}