# Battery State Card
Battery state card for [Home Assistant](https://github.com/home-assistant/home-assistant). It shows battery levels from connected devices (entities).

## Overview

This card was inspired by [another card](https://github.com/cbulock/lovelace-battery-entity) showing the battery states. I have decided to implement my own as there was no response for pull requests and I wanted to fix few things and add couple new features.

![image](https://user-images.githubusercontent.com/8268674/79757248-be630880-8313-11ea-9c3d-531e0743eaf2.png)

## Config

### Card config
| Name | Type | Default | Since | Description |
|:-----|:-----|:-----|:-----|:-----|
| entities | array | **(required)** | v0.1.0 | List of entities (strings or [objects](#entity-object))
| name | string | `"Battery levels"` | v0.1.0 | Card title
| sort_by_level | boolean | `false` | v0.1.0 | Values: `asc`, `desc`

+[appearance options](#appearance-options)


### Entity object
| Name | Type | Default | Since | Description |
|:-----|:-----|:-----|:-----|:-----|
| entity | string | **(required)** | v0.1.0 | Entity ID
| name | string | | v0.1.0 | Entity name override
| attribute | string | | v0.1.0 | Name of attribute (override) to extract the value from. By default we look for values in the following attributes: `battery_level`, `battery`. If they are not present we take entity state.
| multiplier | number | `1` | v0.1.0 | If the value is not in 0-100 rang we can adjust it by specifying multiplier. E.g. if the values are in 0-10 range you can make them working by putting `10` as multiplier.

 +[appearance options](#appearance-options)

### Appearance options

| Name | Type | Default | Since | Description |
|:-----|:-----|:-----|:-----|:-----|
| icon_colors | boolean | `true` | v0.1.0 | Icon color indication of battery level
| good_color | string | `var(--label-badge-green)` | v0.1.0 | Color when battery is in good state
| warrning_color | string | `var(--label-badge-yellow)` | v0.1.0 | Color when battery is in warrning state
| critical_color | string | `var(--label-badge-red)` | v0.1.0 | Color when battery is in critical state
| warrning_level | number | `35` | v0.1.0 | Threshold for warrning level
| critical_level | number | `15` | v0.1.0 | Threshold for critical level

## Examples

You can use this component as a card or as an entity (e.g. in `entities card`);

### Card view
Card view is useful when you want to have cleaner config and when you want to apply same settings (e.g. colors / thresholds) for all the battery entities.

![image](https://user-images.githubusercontent.com/8268674/79760617-3c291300-8318-11ea-8b97-006e3d537568.png)

```yaml
- type: custom:battery-state-card
  entities:
    - sensor.bathroom_motion_battery_level
    - sensor.bedroom_balcony_battery_level
    - entity: sensor.bedroom_motion_battery_level
      name: "Bedroom motion sensor"
```

### Entity view
Entity view is useful when you want to add battery status next to other sensors (in the same card).

![image](https://user-images.githubusercontent.com/8268674/79758073-cff8e000-8314-11ea-94e0-2059460ec4ea.png)

```yaml
- type: entities
    title: Other
    show_header_toggle: false
    entities:
    - sensor.energy_rpi_monthly
    - sensor.home_assistant_v2_db
    - sensor.hassio_online
    - sensor.last_boot
    - type: custom:battery-state-card
      entity: sensor.temp_outside_battery_numeric
```

## Development
```shell
npm install
npm run build
```
Bundeled transpiled code will appear in `dist` directory.
## License