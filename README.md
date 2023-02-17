

# Battery State Card
[![GitHub Release][releases-shield]][releases]
[![GitHub All Releases][downloads-total-shield]][releases]
[![hacs_badge][hacs-shield]][hacs]
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/maxwroc/battery-state-card/Release%20Drafter?label=tests)
[![Community Forum][forum-shield]][forum]

Battery state card for [Home Assistant](https://github.com/home-assistant/home-assistant). It shows battery levels from connected devices (entities).

## Overview

This card was inspired by [another great card](https://github.com/cbulock/lovelace-battery-entity) showing the battery states. I have decided to implement my own as there was no response for pull requests from author and I wanted to fix few things and also add couple new features.

![image](https://user-images.githubusercontent.com/8268674/80753326-fabd1280-8b24-11ea-8f90-4c934793f231.png)

## Update to 2.X.X

If you want to update the card to v2 you need to be aware of few breaking changes:
* When you want to use it as entity (e.g. in `entities` card) you need to use differnt type: `custom:battery-state-entity` instead of `custom:battery-state-card`.
* Custom styles are not supported any more

## Config

### Card config
| Name | Type | Default | Since | Description |
|:-----|:-----|:-----|:-----|:-----|
| type | string | **(required)** | v0.9.0 | Must be `custom:battery-state-card` |
| entities | list([Entity](#entity-object)) | **(required)** | v0.9.0 | List of entities. It can be collection of entity/group IDs (strings) instead of Entity objects.
| title | string |  | v0.9.0 | Card title
| sort_by_level | string |  | v0.9.0 | Values: `asc`, `desc`
| collapse | number \| list([Group](#group-object)) |  | v1.0.0 | Number of entities to show. Rest will be available in expandable section ([example](#sorted-list-and-collapsed-view)). Or list of entity/battery groups ([example](#battery-groups))
| filter | [Filters](#filters) |  | v1.3.0 | Filter groups to automatically include or exclude entities ([example](#entity-filtering-and-bulk-renaming))
| bulk_rename | list([Convert](#convert)) |  | v1.3.0 | Rename rules applied for all entities ([example](#entity-filtering-and-bulk-renaming))

+[common options](#common-options) (if specified they will be apllied to all entities)

### Entity object
| Name | Type | Default | Since | Description |
|:-----|:-----|:-----|:-----|:-----|
| type | string | | v0.9.0 | Must be `custom:battery-state-entity` if used as entity row e.g. in entity-list card  |
| entity | string | **(required)** | v0.9.0 | Entity ID
| name | string |  | v0.9.0 | Entity name override
| icon | string |  | v1.6.0 | Icon override (if you want to set a static custom one). You can provide entity attribute name which contains icon class (e.g. `attributes.battery_icon` - it has to be prefixed with "attributes.")
| attribute | string | | v0.9.0 | Name of attribute (override) to extract the value from. By default we look for values in the following attributes: `battery_level`, `battery`. If they are not present we take entity state.
| multiplier | number | `1` | v0.9.0 | If the value is not in 0-100 range we can adjust it by specifying multiplier. E.g. if the values are in 0-10 range you can make them working by putting `10` as multiplier.

 +[common options](#common-options) (if specified they will override the card-level ones)

### Common options
These options can be specified both per-entity and at the top level (affecting all entities).

| Name | Type | Default | Since | Description |
|:-----|:-----|:-----|:-----|:-----|
| color_thresholds | list([Threshold](#threshold-object)) | (see [below](#default-thresholds)) | v0.9.0 | Thresholds and colors for indication of battery level.
| color_gradient | list(string) | | v0.9.0 | List of hex HTML colors. At least two. In #XXXXXX format, eg. `"#FFB033"`.
| tap_action | [TapAction](#tap-action) |  | v1.1.0 | Action that will be performed when this entity is tapped.
| state_map | list([Convert](#convert))|  | v1.1.0 | Collection of value mappings. It is useful if your sensor doesn't produce numeric values. ([example](#non-numeric-state-values))
| charging_state | [ChargingState](#charging-state-object) |  | v1.1.0 | Configuration for charging indication. ([example](#charging-state-indicators))
| secondary_info | string |  | v1.3.0 | Secondary info text. It can be a custom text, attribute name or state property name e.g. `charging`, `last_changed`, `"My battery"`. ([example](#secondary-info))
| round | number |  | v2.1.0 | Rounds the value to number of fractional digits
| unit | string | `%` | v2.1.0 | Override for unit displayed next to the state/level value ([example](#other-use-cases))

### Threshold object

| Name | Type | Default | Since | Description |
|:-----|:-----|:-----|:-----|:-----|
| value | number | **(required)** | v0.9.0 | Threshold value
| color | string | `inherit` | v0.9.0 | CSS color which will be used for levels below or equal the value field. If not specified the default one is used (default icon/text color for current HA theme)

#### Default thresholds
| Value | Color | Description |
|:------|:------|:------|
| 20 | `var(--label-badge-red)` | If value is less or equal `20` the color will be red
| 55 | `var(--label-badge-yellow)` | If value is less or equal `55` the color will be yellow
| 100 | `var(--label-badge-green)` | If value is less or equal `100` the color will be green

Note: the exact color is taken from CSS variable and it depends on your current template.


### Filters
| Name | Type | Default | Description |
|:-----|:-----|:-----|:-----|
| include | list([Filter](#filter-object)) |  | Filters for auto adding entities
| exclude | list([Filter](#filter-object)) |  | Filters to remove entities dynamically

Note: The action (include/exclude) is performed when at least one of the filters is matching (OR). It is not possible currently to specify two or more conditions (filters combined with AND operator).

Note: Include filters should rely on static entity properties. E.g. you should not add include filter which checks the `state` property. Include filters are processed only once - when page is loaded (to minimize perf impact).

### Filter object
| Name | Type | Default | Description |
|:-----|:-----|:-----|:-----|
| name | string | **(required)** | Name of the property/attribute. E.g. `state`, `attribute.device_class`
| operator | string |  | Operator for value comparison (see [filter operators](#filter-operators))
| value | any |  | Value to compare the property/attribute to

### Filter operators

Operator is an optional property. If operator is not specified it depends on `value` config property:
* if `value` is not specified the default operator is `exists`
* if `value` starts and ends with shalsh "`/`" or if it contains wildcard "`*`" the operator is `matches`
* if `value` property is set but above conditions are not met the operator is "`=`"

| Name | Type |
|:-----|:-----|
| `"exists"` | It just checks if value is present (e.g. to match entities having particular attribute regardless of the attribute value). It doesn't require `value` to be specified.
| `"="` | If value equals the one specified in `value` property.
| `">"` | If value is greater than one specified in `value` property. Possible variant: `">="`. Value must be numeric type.
| `"<"` | If value is lower than one specified in `value` property. Possible variant: `"<="`. Value must be numeric type.
| `"contains"` | If value contains the one specified in `value` property
| `"matches"` | If value matches the one specified in `value` property. You can use wildcards (e.g. `"*_battery_level"`) or regular expression (must be prefixed and followed by slash e.g. `"/[a-z_]+_battery_level/"`)

### Tap-Action
The definition is similar to the default [tap-action](https://www.home-assistant.io/lovelace/actions/#tap-action) in HomeAssistant.
| Name | Type | Default | Description |
|:-----|:-----|:-----|:-----|
| action | string | `none` | Action type, one of the following: `more-info`, `call-service`, `navigate`, `url`, `none`
| service | string |  | Service to call when `action` defined as `call-service`. Eg. `"notify.pushover"`
| service_data | any |  | Service data to inlclue when `action` defined as `call-service`
| navigation_path | string |  | Path to navigate to when `action` defined as `navigate`. Eg. `"/lovelace/0"`
| url_path | string |  | Url to navigate to when `action` defined as `url`. Eg. `"https://www.home-assistant.io"`

### Convert

| Name | Type | Default | Description |
|:-----|:-----|:-----|:-----|
| from | any | **(required)** | Value to convert. Note it is type sensitive (eg. `false` != `"false"`)
| to | any | **(required)** | Target value

### Charging-state object

Note: All of these values are optional but at least `entity_id` or `state` or `attribute` is required.

| Name | Type | Default | Since | Description |
|:-----|:-----|:-----|:-----|:-----|
| entity_id | string |  | v1.1.0 | Other entity id where charging state can be found
| attribute | list([Attribute](#attribute-object)) |  | v1.2.0 | List of attribute name-values indicating charging in progress
| state | list(any) |  | v1.1.0 | List of values indicating charging in progress
| icon | string |  | v1.1.0 | Icon to show when charging is in progress
| secondary_info_text | string |  | v1.1.0 | Text to be shown when battery is charging. To show it you need to have `secondary_info: charging` property set on entity. ([example](#secondary-info))

### Attribute object

| Name | Type | Default | Description |
|:-----|:-----|:-----|:-----|
| name | string | **(required)** | Name of the attribute. If the charging info is in an object use the path e.g. "charger.is_charging"
| value | string |  | Value of the attribute

### Group object

| Name | Type | Default | Since | Description |
|:-----|:-----|:-----|:-----|:-----|
| name | string |  | v1.4.0 | Name of the group. Keywords available: `{min}`, `{max}`, `{count}`, `{range}`
| secondary_info | string |  | v1.4.0 | Secondary info text, shown in the second line. Same keywords available as in `name`
| icon | string |  | v1.4.0 | Group icon. It can be a static icon available in HA or dynamic one taken from one of the group items (`first`, `last`)
| icon_color | string |  | v2.0.0 | Group icon color. It can be a static HTML (e.g. `#ff0000`) or dynamic (`first` or `last`) color value based on the battery colors in the group.
| min | number |  | v1.4.0 | Minimal battery level. Batteries below that level won't be assigned to this group.
| max | number |  | v1.4.0 | Maximal battery level. Batteries above that level won't be assigned to this group.
## Examples

You can use this component as a card or as an entity (e.g. in `entities card`);

### Card view
Card view is useful when you want to have cleaner config (you don't need to duplicate settings in every entity entry) and when you want to apply same settings (e.g. colors) for all the battery entities.

![image](https://user-images.githubusercontent.com/8268674/79760617-3c291300-8318-11ea-8b97-006e3d537568.png)

```yaml
type: custom:battery-state-card
title: "Battery levels"
entities:
  - sensor.bathroom_motion_battery_level
  - sensor.bedroom_balcony_battery_level
  - entity: sensor.bedroom_motion_battery_level
    name: "Bedroom motion sensor"
```

### Entity view
Entity view is useful when you want to add battery status next to other sensors (in the same card).

![image](https://user-images.githubusercontent.com/8268674/79758073-cff8e000-8314-11ea-94e0-2059460ec4ea.png)

Note: there is a different `type` used.

```yaml
type: entities
title: Other
show_header_toggle: false
entities:
  - sensor.energy_rpi_monthly
  - sensor.home_assistant_v2_db
  - sensor.hassio_online
  - sensor.last_boot
  - type: custom:battery-state-entity
    entity: sensor.temp_outside_battery_numeric
```

### Custom colors

#### Custom threshold colors

![image](https://user-images.githubusercontent.com/8268674/79862088-6e487c80-83cd-11ea-8a84-4eecc3601ae2.png)

```yaml
type: custom:battery-state-card
title: "Custom color thresholds"
color_thresholds:
  - value: 35 # applied to all values below/equal
    color: "#8fffe1"
  - value: 45 # applied to all values below/equal
    color: "#8fbbff"
  - value: 60 # applied to all values below/equal
    color: "#978fff"
  - value: 100 # applied to all values below/equal
    color: "#fe8fff"
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
type: custom:battery-state-card
title: "Color gradient"
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

#### Disabling colors

When you put empty array in `color_thresholds` property you can disable colors.

![image](https://user-images.githubusercontent.com/8268674/79975932-aa461500-8493-11ea-9947-f4513863ae53.png)

```yaml
type: custom:battery-state-card
title: "No color"
color_thresholds: []
entities:
  - sensor.bedroom_motion_battery_level
  - sensor.bathroom_motion_battery_level
  - sensor.bedroomtemp_battery_level
  - sensor.bedroom_balcony_battery_level
  - sensor.bedroom_switch_battery_level
```

You can setup as well colors only for lower battery levels and leave the default one for the rest.

![image](https://user-images.githubusercontent.com/8268674/79977247-d793c280-8495-11ea-82f1-78f48ad4fc5b.png)

```yaml
type: custom:battery-state-card
title: "No color - selective"
color_thresholds:
  - value: 20
    color: "red"
  - value: 60
    color: "yellow"
entities:
  - sensor.bedroom_motion_battery_level
  - sensor.bathroom_motion_battery_level
  - sensor.bedroomtemp_battery_level
  - sensor.bedroom_balcony_battery_level
  - sensor.bedroom_switch_battery_level
```

### Sorted list and collapsed view

![ezgif com-resize](https://user-images.githubusercontent.com/8268674/80119122-31bd8200-8581-11ea-9221-aee943d0b1a0.gif)

```yaml
type: custom:battery-state-card
title: "Sorted list and collapsed view"
sort_by_level: "asc"
collapse: 4
entities:
  - sensor.bedroom_motion_battery_level
  - sensor.bathroom_motion_battery_level
  - sensor.bedroomtemp_battery_level
  - sensor.bedroom_balcony_battery_level
  - sensor.bedroom_switch_battery_level
```
### Battery groups

Battery groups allow you to group together set of batteries/entities based on couple conditions. You can use HA group entities to tell which entities should go to the group, or you can set min/max battery levels, or specify explicit list of entities which should be assigned to particular group.

Note: If you have battery groups defined in Home Assistant you can use their IDs instead of single entity ID (in `entities` collection).

![image](https://user-images.githubusercontent.com/8268674/84313600-aa42c700-ab5e-11ea-829e-394b292f3cbe.png)

```yaml
type: 'custom:battery-state-card'
title: Battery state card
sort_by_level: asc
collapse:
  - name: 'Door sensors (min: {min}%, count: {count})' # special keywords in group name
    secondary_info: 'Battery levels {range}%' # special keywords in group secondary info
    icon: 'mdi:door'
    entities: # explicit list of entities
      - sensor.bedroom_balcony_battery_level
      - sensor.main_door_battery_level
      - sensor.living_room_balcony_battery_level
  - group_id: group.motion_sensors_batteries # using HA group
    secondary_info: No icon # Secondary info text
    icon: null # removing default icon for this group (from HA group definition)
  - group_id: group.temp_sensors_batteries
    min: 99 # all entities below that level should show up ungroupped
    icon: 'mdi:thermometer' # override for HA group icon
entities:
  # if you need to specify some properties for any entity in the group
  - entity: sensor.bedroom_balcony_battery_level
    name: "Bedroom balkony door"
    multiplier: 10
  # entities from below HA group won't be grouped as there is no corresponding collapsed group
  - group.switches_batteries
```

### Non-numeric state values

If your sensor doesn't produce numeric values you can use `state_map` property and provie mappings from one value to the other.

```yaml
type: custom:battery-state-card
title: "String values - state map"
entities:
  - entity: binary_sensor.battery_state
    name: "Binary sensor state"
    state_map:
      - from: "on"
        to: 100
      - from: "off"
        to: 25
  - entity: sensor.bedroom_motion
    name: "Sensor string attribute"
    attribute: "replace_battery"
    state_map:
      - from: false
        to: 100
      - from: true
        to: 25
```

### Charging state indicators

If your device provides charging state you can configure it in the following way:

![image](https://user-images.githubusercontent.com/8268674/80610521-5e661380-8a31-11ea-9c71-75e11c2ec009.png)

```yaml
type: custom:battery-state-card
title: "Charging indicators"
entities:
  - entity: sensor.device_battery_numeric
    charging_state: # uses other entity state value
      entity_id: binary_sensor.device_charging
      state: "on"
  - entity: sensor.mi_roborock
    charging_state: # uses sensor.mi_roborock state value
      state: "charging"
      icon: "mdi:flash"
      color: "yellow"
  - entity: sensor.samsung
    charging_state: # uses is_charging attribute on sensor.samsung entity
      attribute:
        name: "is_charging"
        value: "yes"
```

Card-level charging state configuration

```yaml
type: custom:battery-state-card
title: "Charging indicators"
charging_state:
  attribute: # whenever one of below attributes is matching
    - name: "Battery State"
      value: "Charging"
    - name: "is_charging"
      value: true
  state: # or if entity state matches one of the following
    - "charging"
    - "Charging"
entities:
  - sensor.device_battery_numeric
  - sensor.mi_roborock
  - sensor.samsung
```

### Entity filtering and bulk renaming
If you want to add battery entities automatically or if you want to see them only in specific conditions you can use filters.

If you add entities automatically you cannot specify properties for individual entities. It is possible though to specify card-level properties which will be applied to all entities (see [common options](#common-options)). For example if you wanted to set custom names (e.g. if your sensors are suffixed with some common string) you can use `bulk_rename` property to define renaming rules.

![filters](https://user-images.githubusercontent.com/8268674/82096304-97240f00-96f8-11ea-9376-a9878f56ce94.png)

```yaml
type: 'custom:battery-state-card'
title: Filters
sort_by_level: "asc"
bulk_rename:
  - from: "Battery Level" # simple string replace (note: "to" is not required if you want to remove string)
    to: "sensor"
  - from: "/\\s(temperature|temp)\\s/" # regular expression
    to: " temp. "
entities:
  # entities requiring additional properties can be added explicitly
  - entity: sensor.temp_outside_battery_numeric
    multiplier: 10
    name: "Outside temp. sensor"
filter:
  include: # filters for auto-adding
    - name: entity_id # entities which id ends with "_battery_level"
      value: "*_battery_level"
    - name: attributes.device_class # and entities which device_class attribute equals "battery"
      value: battery
  exclude: # filters for removing
    - name: state # exclude entities above 99% of battery level
      value: 99
      operator: ">"
```

### Secondary info

![image](https://user-images.githubusercontent.com/8268674/80970635-63510b80-8e13-11ea-8a9a-6bc8d873092b.png)

```yaml
type: custom:battery-state-card
name: Secondary info
secondary_info: last_updated # applied to all entities which don't have the override
entities:
  - entity: sensor.bedroom_motion_battery_level
    name: "Bedroom motion sensor"
  - entity: sensor.mi_robrock
    secondary_info: charging # only appears when charging is detected
    charging_state:
      attribute:
        name: "is_charging"
        value: true
      secondary_info_text: "Charging in progress" # override for "Charging" text
  - entity: sensor.jacks_motorola
    name: "Jack's phone"
    secondary_info: "Motorola" # Static text
```

### Tap actions

![image](https://user-images.githubusercontent.com/8268674/97094268-62bf6200-164b-11eb-8d7d-344f9842f85e.png)

```yaml
type: 'custom:battery-state-card'name: Click
color_gradient:
  - '#ff0000'
  - '#0000ff'
  - '#00ff00'
entities:
  - entity: sensor.bedroom_motion_battery_level
    name: More info
    tap_action: more-info
    value_override: 100
  - entity: sensor.bathroom_motion_battery_level
    name: Navigation path
    tap_action:
      action: navigate
      navigation_path: /lovelace/1
    value_override: 0
  - entity: sensor.bedroomtemp_battery_level
    name: Call service - Pushover
    tap_action:
      action: call-service
      service: notify.pushover
      service_data:
        message: Call service works
        title: Some title
    value_override: 60
  - entity: sensor.bedroom_balcony_battery_level
    name: Url
    tap_action:
      action: url
      url_path: 'http://reddit.com'
    value_override: 20
  - entity: sensor.bedroom_switch_battery_level
    name: No action
    value_override: 80

```

### Other use cases

![image](https://user-images.githubusercontent.com/8268674/147777101-c6f8a299-a03e-4792-a92c-8477b03d1941.png)

```yaml
type: custom:battery-state-card
title: Link quality
sort_by_level: asc
color_gradient:
  - '#ff0000'
  - '#ffff00'
  - '#00ff00'
icon: mdi:signal
unit: lqi
entities:
  - entity: sensor.bathroom_motion_signal
    name: Bathroom motion sensor
  - entity: sensor.bedroom_balcony_signal
    name: Bedroom balkony door sensor
  - entity: sensor.bedroom_motion_signal
    name: Bedroom motion sensor
  - entity: sensor.bedroom_switch_signal
    name: Bedroom Aqara switch
  - entity: sensor.bedroomtemp_signal
    name: Bedroom temp. sensor
```
![image](https://user-images.githubusercontent.com/10567188/151678867-28bd47b9-fb66-42ed-a78a-390d55860634.png)

```yaml
type: custom:battery-state-card
title: HDD temperatures
icon: mdi:harddisk
color_thresholds:
  - value: 26
    color: blue
  - value: 36
    color: green
  - value: 45
    color: yellow
  - value: 60
    color: red
tap_action:
  action: more-info
collapse: 3
sort_by_level: desc
unit: °C
round: 0
filter:
  include:
    - name: entity_id
      value: sensor.nasos_sd*
    - name: entity_id
      value: sensor.omv2_sd*
    - name: entity_id
      value: sensor.exnas_st12*temper*
    - name: entity_id
      value: sensor.*_disk_*_temperature
entities:
  - entity: sensor.vidik_temperature
  - entity: sensor.exnas_d1_temperatures_temperature
```
## Installation

Once added to [HACS](https://community.home-assistant.io/t/custom-component-hacs/121727) add the following resource to your **lovelace** configuration (if you have yaml mode active)
```yaml
lovelace:
  mode: yaml
  resources:
    - url: /hacsfiles/battery-state-card/battery-state-card.js
      type: module
```

If you don't have HACS you can download js file from [latest release](https://github.com/maxwroc/battery-state-card/releases/latest). Drop it then in `www` folder in your `config` directory. Next add the following entry in lovelace configuration
```yaml
resources:
  - url: /local/battery-state-card.js
    type: module
```

## Development
```shell
npm install
npm run build
```
Bundeled transpiled code will appear in `dist` directory.

For automatic compilation on detected changes use:
```
npm run watch
```

Note: there is "undocumented" `value_override` property on the [entity object](#entity-object) which you can use for testing.

## Do you like the card?

If you do like the card please star it on [github](https://github.com/maxwroc/battery-state-card)! This is a great way to give feedback and motivation boost for me to continue working on it. Thanks!

## License

This project is under the [MIT license](https://github.com/maxwroc/battery-state-card/blob/master/LICENSE).

## Automatic notifications about low battery levels

It is not possible to do such a thing from the card level. If you want to get automatic notifications/alerts you can use the blueprint shared by sbyx:

https://my.home-assistant.io/create-link/?redirect=blueprint_import&blueprint_url=https%3A%2F%2Fgist.github.com%2Fsbyx%2F1f6f434f0903b872b84c4302637d0890

Click on "copy url" button and paste it in your browser. If you have configured my.home-assistant.io already you should be redirected to the page in your HA where you can review the blueprint code and add it. Once you add it you can create automation based on it.

## My other HA related repos
[github-flexi-card](https://github.com/maxwroc/github-flexi-card) | [homeassistant-config](https://github.com/maxwroc/homeassistant) | [lovelace-card-boilerplate](https://github.com/maxwroc/lovelace-card-boilerplate)


[releases]: https://github.com/maxwroc/battery-state-card/releases
[releases-shield]: https://img.shields.io/github/release/maxwroc/battery-state-card.svg?style=popout
[downloads-total-shield]: https://img.shields.io/github/downloads/maxwroc/battery-state-card/total
[forum]: https://community.home-assistant.io/t/lovelace-battery-state-card/191535
[forum-shield]: https://img.shields.io/badge/community-forum-brightgreen.svg?style=popout
[hacs-shield]: https://img.shields.io/badge/HACS-Default-orange.svg
[hacs]: https://hacs.xyz/docs/default_repositories
