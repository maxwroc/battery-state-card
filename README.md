# Battery State Card
Battery state card for [Home Assistant](https://github.com/home-assistant/home-assistant). It shows battery levels from connected devices (entities).

## Overview

This card was inspired by [another great card](https://github.com/cbulock/lovelace-battery-entity) showing the battery states. I have decided to implement my own as there was no response for pull requests from author and I wanted to fix few things and also add couple new features.

Card code is very small - less than 10KB. It **doesn't** depend on external dependencies (eg. downloaded every time from CDN).

![image](https://user-images.githubusercontent.com/8268674/79757248-be630880-8313-11ea-9c3d-531e0743eaf2.png)

## Config

### Card config
| Name | Type | Default | Since | Description |
|:-----|:-----|:-----|:-----|:-----|
| entities | array(string \| [Entity](#entity-object)) | **(required)** | v0.1.0 | List of entities
| name | string | `"Battery levels"` | v0.1.0 | Card title
| sort_by_level | string |  | v0.1.0 | Values: `asc`, `desc`

+[appearance options](#appearance-options)


### Entity object
| Name | Type | Default | Since | Description |
|:-----|:-----|:-----|:-----|:-----|
| entity | string | **(required)** | v0.1.0 | Entity ID
| name | string | | v0.1.0 | Entity name override
| attribute | string | | v0.1.0 | Name of attribute (override) to extract the value from. By default we look for values in the following attributes: `battery_level`, `battery`. If they are not present we take entity state.
| multiplier | number | `1` | v0.1.0 | If the value is not in 0-100 range we can adjust it by specifying multiplier. E.g. if the values are in 0-10 range you can make them working by putting `10` as multiplier.

 +[appearance options](#appearance-options)

### Appearance options

| Name | Type | Default | Since | Description |
|:-----|:-----|:-----|:-----|:-----|
| color_thresholds | array([Threshold](#threshold-object)) | (see [below](#default-thresholds)) | v0.1.0 | Thresholds and colors for indication of battery level.
| color_gradient | array(string) | | v0.1.0 | Array of hex HTML colors. At least two. In #XXXXXX format, eg. `"#FFB033"`.

### Threshold object

| Name | Type | Default | Since | Description |
|:-----|:-----|:-----|:-----|:-----|
| value | number | **(required)** | v0.1.0 | Threshold value
| color | string | `inherit` | v0.1.0 | CSS color which will be used for levels below or equal the value field. If not specified the default one is used (default icon/text color for current HA theme)

#### Default thresholds
| Value | Color | Description |
|:------|:------|:------|
| 20 | `var(--label-badge-red)` | If value is less or equal `20` the color will be red
| 55 | `var(--label-badge-yellow)` | If value is less or equal `55` the color will be yellow
| 100 | `var(--label-badge-green)` | If value is less or equal `100` the color will be green

Note: the exact color is taken from CSS variable and it depends on your current template.

## Examples

You can use this component as a card or as an entity (e.g. in `entities card`);

### Card view
Card view is useful when you want to have cleaner config (you don't need to duplicate settings in every entity entry) and when you want to apply same settings (e.g. colors) for all the battery entities.

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

### Custom colors

#### Custom threshold colors

![image](https://user-images.githubusercontent.com/8268674/79767239-f6bd1380-8320-11ea-8b12-c3eaccc7c78c.png)

```yaml
- type: custom:battery-state-card
  thresholds:
    - value: 35 # all values below
      color: "#E45E65"
    - value: 60 # all values below
      color: "orange"
    - value: 90 # all values below
      color: "yellow"
    - value: 100 # all values below
      color: "lightgreen"
  entities:
    - entity: sensor.bathroom_motion_battery_level
      name: "Bathroom motion sensor"
    - entity: sensor.bedroom_balcony_battery_level
      name: "Bedroom balkony door sensor"
    - entity: sensor.bedroom_motion_battery_level
      name: "Bedroom motion sensor"
    - entity: sensor.bedroom_switch_battery_level
      name: "Bedroom Aqara switch"
    - entity: sensor.bedroomtemp_battery_level
      name: "Bedroom temp. sensor"
```

#### Gradient colors

![image](https://user-images.githubusercontent.com/8268674/79856685-8ec00900-83c4-11ea-82bf-b3df6385850f.png)

```yaml
- type: custom:battery-state-card
  color_gradient:
    - "#ff0000" # red
    - "#ffff00" # yellow
    - "#00ff00" # green
  entities:
    - entity: sensor.bathroom_motion_battery_level
      name: "Bathroom motion sensor"
    - entity: sensor.bedroom_balcony_battery_level
      name: "Bedroom balkony door sensor"
    - entity: sensor.bedroom_motion_battery_level
      name: "Bedroom motion sensor"
    - entity: sensor.bedroom_switch_battery_level
      name: "Bedroom Aqara switch"
    - entity: sensor.bedroomtemp_battery_level
      name: "Bedroom temp. sensor"
```


## Development
```shell
npm install
npm run build
```
Bundeled transpiled code will appear in `dist` directory.

Note: there is "undocumented" `value_override` property on the [entity object](#entity-object) which you can use for testing.

## License

This project is under the [MIT license](https://github.com/maxwroc/battery-state-card/blob/master/LICENSE).