

# Battery State Card
[![GitHub Release][releases-shield]][releases]
[![GitHub All Releases][downloads-total-shield]][releases]
[![hacs_badge][hacs-shield]][hacs]
[![Coverage Status](https://coveralls.io/repos/github/maxwroc/battery-state-card/badge.svg?branch=master)](https://coveralls.io/github/maxwroc/battery-state-card?branch=master)
[![Community Forum][forum-shield]][forum]

<!-- ![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/maxwroc/battery-state-card/release-drafter.yml?label=tests) -->

Battery state card for [Home Assistant](https://github.com/home-assistant/home-assistant). It shows battery levels from connected devices (entities).

## Overview

This card was inspired by [another great card](https://github.com/cbulock/lovelace-battery-entity) showing the battery states. I have decided to implement my own as there was no response for pull requests from author and I wanted to fix few things and also add couple new features.

![image](https://user-images.githubusercontent.com/8268674/80753326-fabd1280-8b24-11ea-8f90-4c934793f231.png)

## Breaking changes

<details>
  <summary>Update to v3.X.X</summary>

* Secondary info last_updated / last_changed values. Now these values has to be put in quotes and curly braces e.g. `secondary_info: "{last_updated}"`
* Secondary info charging indication. Now the value has to be in curly braces e.g. `secondary_info: "{charging}"`
* Sorting setting has changed. Now it is called `sort` (previously "sort_by_level") and it can define multiple levels of sorting.
* Color settings are now in a single config entry `colors` ("color_thresholds" and "color_gradient" settings are not working any more)
</details>

<details>
  <summary>Update to v2.X.X</summary>

* When you want to use it as entity (e.g. in `entities` card) you need to use differnt type: `custom:battery-state-entity` instead of `custom:battery-state-card`.
* Custom styles are not supported any more
</details>

## Config

### Default card config

When config is empty the card is initialized with the default config which you can find below. Once you start adding custom configuration the default configuration won't be applied hence if you wish to alter the default config please copy-paste it from the below listing.
```yaml
type: custom:battery-state-card
secondary_info: "{last_changed}"
filter:
  include:
    - name: "attributes.device_class"
      value: "battery"
  exclude:
    - name: "entity_id"
      value: "binary_sensor.*"
sort:
  by: "state"
collapse: 8
bulk_rename:
  - from: " Battery"
  - from: " level"
colors:
  steps:
    - '#ff0000'
    - '#ffff00'
    - '#00ff00'
  gradient: true
```

### Card config

| Name | Type | Default | Since | Description |
|:-----|:-----|:-----|:-----|:-----|
| type | string | **(required)** | v0.9.0 | Must be `custom:battery-state-entity` |
| entities | list([Entity](#entity-object) \| string) |  | v0.9.0 | List of entities. It can be collection of entity/group IDs (strings) instead of Entity objects.
| title | string |  | v0.9.0 | Card title
| sort | list([Sort](#sort-object) \| string) |  | v3.0.0 | Sets the sorting options
| collapse | number \| list([Group](#group-object)) |  | v1.0.0 | Number of entities to show. Rest will be available in expandable section ([example](#sorted-list-and-collapsed-view)). Or list of entity/battery groups ([example](#battery-groups))
| filter | [Filters](#filters) |  | v1.3.0 | Filter groups to automatically include or exclude entities ([example](#entity-filtering-and-bulk-renaming))
| bulk_rename | list([Convert](#convert)) \| [BulkRename](#bulk-rename) |  | v1.3.0 | Rename rules applied for all entities ([example](#entity-filtering-and-bulk-renaming))

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
| colors | [ColorSettings](#color-settings) | (see [below](#default-colors)) | v3.0.0 | Color settings
| tap_action | [TapAction](#tap-action) | more-info | v1.1.0 | Action that will be performed when this entity is tapped.
| state_map | list([Convert](#convert))|  | v1.1.0 | Collection of value mappings. It is useful if your sensor doesn't produce numeric values. ([example](#non-numeric-state-values))
| charging_state | [ChargingState](#charging-state-object) |  | v1.1.0 | Configuration for charging indication. ([example](#charging-state-indicators))
| secondary_info | [KString](#keyword-string-kstring) |  | v3.0.0 | Secondary info text. It can be a custom text with keywords (dynamic values) ([example](#secondary-info))
| round | number |  | v2.1.0 | Rounds the value to number of fractional digits
| unit | string | `"%"` | v2.1.0 | Override for unit displayed next to the state/level value ([example](#other-use-cases))
| value_override | [KString](#keyword-string-kstring) |  | v3.0.0 | Allows to override the battery level value. Note: when used the `multiplier`, `round`, `state_map` setting is ignored
| non_battery_entity | boolean | `false` | v3.0.0 | Disables default battery state sources e.g. "battery_level" attribute
| default_state_formatting | boolean | `true` | v3.1.0 | Can be used to disable default state formatting e.g. entity display precission setting
| debug | boolean \| string | `false` | v3.2.0 | Whether to show debug output (all available entity data). You can use entity_id if you want to debug specific one.
| respect_visibility_setting | boolean | `true` | v3.3.0 | Whether to hide entities which are marked in the UI as hidden on dashboards.

### Keyword string (KString)

This is a string value containing dynamic values. Data for dynamic values can be taken from entity properties, its attributes, other entity state/attributes, etc.

| Type | Example | Description |
|:-----|:-----|:-----|
| Charging state | `"{charging}"` | Shows text specified in [ChargingState](#charging-state-object)
| Entity property | `"{last_updated}"` | Current entity property. To ensure relative time, use the reltime() function via "\|" (see below). E.g.: `"Changed: {last_updated\|reltime()}"`
| Entity attributes | `"Remaining time: {attributes.remaining_time}"` | Current entity attribute value.
| Other entity data | `"Since last charge: {sensor.tesla.attributes.distance}"` | You can use full "path" to the other entity data

Keywords support simple functions to convert the values

| Func | Example | Description |
|:-----|:-----|:-----|
| round(\[number\]) | `"{state\|round(2)}"` | Rounds the value to number of fractional digits. E.g. if state is 20.617 the output will be 20.62.
| replace(\[old_string\],\[new_string\]) | `"{attributes.friendly_name\|replace(Battery level,)}"` | Simple replace. E.g. if name contains "Battery level" string then it will be removed
| multiply(\[number\]) | `"{state\|multiply(10)}"` | Multiplies the value by given number
| greaterthan(\[threshold_number\],\[result_value\]) | `"{state\|greaterthan(10,100)}"` | Changes the value to a given one when the threshold is met. In the given example the value will be replaced to 100 when the current value is greater than 10
| lessthan(\[threshold_number\],\[result_value\]) | `"{state\|lessthan(10,0)}"` | Changes the value to a given one when the threshold is met. In the given example the value will be replaced to 0 when the current value is less than 10
| between(\[lower_threshold_number\],[upper_threshold_number\],\[result_value\]) | `"{state\|between(2,6,30)}"` | Changes the value to a given one when the value is between two given numbers. In the given example the value will be replaced to 30 when the current value is between 2 and 6
| thresholds(\[number1\],\[number2\],...) | `"{state\|thresholds(22,89,200,450)}"` | Converts the value to percentage based on given thresholds. In the given example values will be converted in the following way 20=>0, 30=>25, 99=>50, 250=>75, 555=>100
| abs() | `"{state\|abs()}"` | Produces the absolute value
| equals(\[value\],\[result_value\]) | `"{state\|equals(on,1)}"` | Changes the value conditionally - whenever the initial value is equal the given one
| reltime() | `"Changed: {last_changed\|reltime()}"` | Converts date to relative time e.g. "1 minute ago"

You can execute functions one after another. For example if you have the value "Battery level: 26.543234%" and you want to extract and round the number then you can do the following: `"{attribute.battery_level|replace(Battery level:,)|replace(%,)|round()} %"` and the end result will be "27"

### Sort object

| Name | Type | Default | Since | Description |
|:-----|:-----|:-----|:-----|:-----|
| by | string | **(required)** | v3.0.0 | Field of the entity used to sort (`"state"` or `"name"`)
| desc | boolean | `false` | v3.0.0 | Whether to sort in descending order


Note: you can simplify this setting and use just use strings if you want to keep ascending order e.g.:

```yaml
sort:
  - "name"
  - "state"
```

Note: the state and name values used for sorting are the ones you see rendered on the card (e.g. after state_map transformations). You can use raw entity values to sort by prefixing their names with `entity.`. E.g. `entity.last_changed` or `entity.attributes.battery_level` or `entity.state`

### Color settings

| Name | Type | Default | Since | Description |
|:-----|:-----|:-----|:-----|:-----|
| steps | list([ColorStep](#color-step) \| string) | **(required)** | v3.0.0 | List of colors or color steps
| gradient | boolean | `false` | v3.0.0 | Whether to enable smooth color transition between steps

Note: enabling `gradient` requires at least two colors/steps and all provided colors need to be in hex HTML format e.g. `#ff00bb`.

#### Color step

| Name | Type | Default | Since | Description |
|:-----|:-----|:-----|:-----|:-----|
| value | number | **(required)** | v0.9.0 | Threshold value
| color | string | `inherit` | v0.9.0 | CSS color which will be used for levels below or equal the value field. If not specified the default one is used (default icon/text color for current HA theme)

#### Default colors
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

Note: The action (include/exclude) is performed when at least one of the filters is matching (OR). Since v3.3.0 you can use [composite filters](#composite-filters) (`and`, `or`, `not`) to combine multiple conditions.

Note: Include filters should rely on static entity properties. E.g. you should not add include filter which checks the `state` property. Include filters are processed only once - when page is loaded (to minimize perf impact).

### Filter object
| Name | Type | Default | Description |
|:-----|:-----|:-----|:-----|
| name | string | **(required)** | Name of the property/attribute. E.g. `state`, `attribute.device_class`
| operator | string |  | Operator for value comparison (see [filter operators](#filter-operators))
| value | any |  | Value to compare the property/attribute to

### Composite filters

Since v3.3.0, you can create complex filter conditions using logical operators:

| Name | Type | Since | Description |
|:-----|:-----|:-----|:-----|
| `and` | list([Filter](#filter-object)) | v3.3.0 | Matches when **all** filters in the list match
| `or` | list([Filter](#filter-object)) | v3.3.0 | Matches when **any** filter in the list matches
| `not` | [Filter](#filter-object) | v3.3.0 | Inverts the result of the filter (matches when the filter doesn't match)

Composite filters can be nested to create complex conditions.

**Example: Using AND to match entities with both conditions**
```yaml
filter:
  include:
    - and:
        - name: entity_id
          value: "*_battery*"
        - name: state
          operator: "<"
          value: 50
```

**Example: Using OR for multiple patterns**
```yaml
filter:
  include:
    - or:
        - name: entity_id
          value: "*_battery"
        - name: entity_id
          value: "*_power"
```

**Example: Using NOT to exclude specific entities**
```yaml
filter:
  include:
    - name: attributes.device_class
      value: battery
  exclude:
    - not:
        name: state
        operator: "<"
        value: 20
```

**Example: Complex nested conditions**
```yaml
filter:
  include:
    - and:
        - or:
            - name: entity_id
              value: "sensor.*_battery"
            - name: attributes.device_class
              value: battery
        - not:
            name: entity_id
            value: "*_exclude_*"
```

### Filter operators

Operator is an optional property. If operator is not specified it depends on `value` config property:
* if `value` is not specified the default operator is `exists`
* if `value` starts and ends with shalsh "`/`" or if it contains wildcard "`*`" the operator is `matches`
* if `value` property is set but above conditions are not met the operator is "`=`"

| Name | Since | Type |
|:-----|:-----|:-----|
| `"exists"` | v1.3.0 | It checks if field is present (e.g. to match entities having particular attribute regardless of the attribute value). It doesn't require `value` to be specified.
| `"not_exists"` | v3.1.0 | It checks if field is not present (e.g. to match entities without particular attribute). It doesn't require `value` to be specified.
| `"="` | v1.3.0 | If value equals the one specified in `value` property.
| `">"` | v1.3.0 | If value is greater than one specified in `value` property. Possible variant: `">="`. Value must be numeric type.
| `"<"` | v1.3.0 | If value is lower than one specified in `value` property. Possible variant: `"<="`. Value must be numeric type.
| `"contains"` | v1.3.0 | If value contains the one specified in `value` property
| `"matches"` | v1.3.0 | If value matches the one specified in `value` property. You can use wildcards (e.g. `"*_battery_level"`) or regular expression (must be prefixed and followed by slash e.g. `"/[a-z_]+_battery_level/"`)

### Tap-Action

The definition is similar to the default [tap-action](https://www.home-assistant.io/lovelace/actions/#tap-action) in HomeAssistant.
| Name | Type | Default | Description |
|:-----|:-----|:-----|:-----|
| action | string | `more-info` | Action type, one of the following: `more-info`, `call-service`, `navigate`, `url`, `none`
| service | string |  | Service to call when `action` defined as `call-service`. Eg. `"notify.pushover"`
| service_data | any |  | Service data to inlclue when `action` defined as `call-service`
| navigation_path | string |  | Path to navigate to when `action` defined as `navigate`. Eg. `"/lovelace/0"`
| url_path | string |  | Url to navigate to when `action` defined as `url`. Eg. `"https://www.home-assistant.io"`

Note: From version 3.3.0 card supports all native Home Assistant actions and related functionalities: [Actions - Home Assistant](https://www.home-assistant.io/dashboards/actions/#tap-action)

### Convert

| Name | Type | Default | Since | Description |
|:-----|:-----|:-----|:-----|:-----|
| from | any | **(required)** | v1.1.0 | Value to convert. Note it is type sensitive (eg. `false` != `"false"`)
| to | any | **(required)** | v1.1.0 | Target value
| display | string |  | v3.0.0 | Override for displayed entity state (when the current entiy state matches the `from` value)

### Bulk rename

| Name | Type | Default | Since | Description |
|:-----|:-----|:-----|:-----|:-----|
| rules | list([Convert](#convert)) |  | v3.1.0 | Rename rules applied for all entities
| capitalize_first | bool | `true` | v3.1.0 | Whether to capitalize first letter ([example](#entity-filtering-and-bulk-renaming))

### Charging-state object

Note: All of these values are optional but at least `entity_id` or `state` or `attribute` is required.

| Name | Type | Default | Since | Description |
|:-----|:-----|:-----|:-----|:-----|
| entity_id | string |  | v1.1.0 | Other entity id where charging state can be found
| attribute | list([Attribute](#attribute-object)) |  | v1.2.0 | List of attribute name-values indicating charging in progress
| state | list(any) |  | v1.1.0 | List of values indicating charging in progress
| icon | string |  | v1.1.0 | Icon to show when charging is in progress
| secondary_info_text | string |  | v1.1.0 | Text to be shown when battery is charging. To show it you need to have `secondary_info: "{charging}"` property set on entity. ([example](#secondary-info))

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
| entities | list(string) |  | v1.4.0 | List of endity ids

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
colors:
  steps:
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
colors:
  steps:
    - "#ff0000" # red
    - "#ffff00" # yellow
    - "#00ff00" # green
  gradient: true
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

When you put empty array in `steps` property you can disable colors.

![image](https://user-images.githubusercontent.com/8268674/79975932-aa461500-8493-11ea-9947-f4513863ae53.png)

```yaml
type: custom:battery-state-card
title: "No color"
colors:
  steps: []
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
colors:
  steps:
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
sort: "state"
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
sort: "state"
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
sort: "state"
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

Bulk rename using BulkRename object to disable capitalizing the first letter of entity name (enabled by default)

```yaml
type: 'custom:battery-state-card'
title: Filters
sort: "state"
bulk_rename:
  rules:
    - from: "Battery Level" # simple string replace (note: "to" is not required if you want to remove string)
      to: "sensor"
    - from: "/\\s(temperature|temp)\\s/" # regular expression
      to: " temp. "
  capitalize_first: false
filter:
  include: # filters for auto-adding
    - name: entity_id # entities which id ends with "_battery_level"
      value: "*_battery_level"
    - name: attributes.device_class # and entities which device_class attribute equals "battery"
      value: battery
```

### Secondary info

![image](https://user-images.githubusercontent.com/8268674/80970635-63510b80-8e13-11ea-8a9a-6bc8d873092b.png)

```yaml
type: custom:battery-state-card
name: Secondary info
secondary_info: "{last_updated}" # applied to all entities which don't have the override
entities:
  - entity: sensor.bedroom_motion_battery_level
    name: "Bedroom motion sensor"
  - entity: sensor.mi_robrock
    secondary_info: "{charging}" # only appears when charging is detected
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
colors:
  steps:
    - '#ff0000'
    - '#0000ff'
    - '#00ff00'
  gradient: true
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

#### RSSI sensors (signal strength)

![image](https://github.com/maxwroc/battery-state-card/assets/8268674/40957377-d523-45d2-99ae-39325b5ddacc)
![image](https://github.com/maxwroc/battery-state-card/assets/8268674/477149f8-9d88-4858-b1f4-f7c615186845)

```yaml
type: custom:battery-state-card
secondary_info: '{last_changed}'
icon: mdi:signal
# below an example with dynamic icon
# icon: "mdi:signal-cellular-{state|abs()|greaterthan(69,outline)|greaterthan(59,1)|greaterthan(49,2)|greaterthan(2,3)}"
filter:
  include:
    - name: attributes.device_class
      value: signal_strength
sort:
  by: state
collapse: 8
bulk_rename:
  - from: ' Signal'
  - from: ' strength'
  - from: ' Rssi'
  - from: ' numeric'
value_override: '{state|abs()}'
colors:
  steps:
    - color: '#00ff00'
      value: 50
    - color: '#ffff00'
      value: 65
    - color: '#ff0000'
      value: 100
  gradient: true
```

#### HDD temperatures

![image](https://user-images.githubusercontent.com/10567188/151678867-28bd47b9-fb66-42ed-a78a-390d55860634.png)

```yaml
type: custom:battery-state-card
title: HDD temperatures
icon: mdi:harddisk
colors:
  steps:
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
sort:
  by: state
  desc: true
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

#### Motion sensors (sorted by state and last changed property)

![image](https://github.com/maxwroc/battery-state-card/assets/8268674/cd9291bf-1804-4783-9436-622c4b63fe56)

```yaml
type: custom:battery-state-card
secondary_info: '{last_changed}'
icon: '{state|equals(off,mdi:motion-sensor-off)|equals(on,mdi:motion-sensor)}'
filter:
  include:
    - name: attributes.device_class
      value: motion
sort:
  - by: state
    desc: true
  - by: entity.last_changed
    desc: true
colors:
  steps:
    - value: 0
      color: inherit
    - value: 1
      color: var(--state-active-color)
unit: null
state_map:
  - from: 'off'
    to: 0
    display: Clear
  - from: 'on'
    to: 1
    display: Detected
collapse: 8

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

## Troubleshooting

You can turn on the debug output via `debug` setting. It can be turned on for all of the entities:

```yaml
debug: true
```

Or single entity by specifying entity_id:
```yaml
debug: sensor.owl_energy_signal_strength
```

![image](https://github.com/maxwroc/battery-state-card/assets/8268674/04a2b1c8-662a-4067-9231-1d8314914ed3)

Note: "Copy to clipboard" is available only if you access your HA via https.

After clicking on show/hide you will see the entity data which is available for the card to process.

<details>
  <summary>Click to see example output</summary>

```json
{
  "entity_id": "sensor.owl_energy_signal_strength",
  "state": "-72",
  "attributes": {
    "state_class": "measurement",
    "event": "115a011a32e20100000172000031bbc85d69",
    "unit_of_measurement": "dBm",
    "assumed_state": true,
    "device_class": "signal_strength",
    "friendly_name": "Owl energy Signal strength"
  },
  "context": {
    "id": "01HPC8X76DDZ4D3XK5BMH8KKFW",
    "parent_id": null,
    "user_id": null
  },
  "last_changed": "2024-02-11T14:24:59.597Z",
  "last_updated": "2024-02-11T14:24:59.597Z",
  "display": {
    "entity_id": "sensor.owl_energy_signal_strength",
    "device_id": "91b4ffe9a73db4d1ee9482d0e7d94a84",
    "platform": "rfxtrx",
    "entity_category": "diagnostic",
    "name": "Signal strength"
  },
  "device": {
    "area_id": "outside",
    "configuration_url": null,
    "config_entries": [
      "2c67d4fe27613df1b3de59a1f042dc5c"
    ],
    "connections": [],
    "disabled_by": null,
    "entry_type": null,
    "hw_version": null,
    "id": "91b4ffe9a73db4d1ee9482d0e7d94a84",
    "identifiers": [
      [
        "rfxtrx",
        "5a",
        "1",
        "32:e2"
      ]
    ],
    "manufacturer": null,
    "model": "ELEC2, CM119/160",
    "name_by_user": "Owl energy",
    "name": "ELEC2, CM119/160 32:e2",
    "serial_number": null,
    "sw_version": null,
    "via_device_id": null
  },
  "area": {
    "aliases": [],
    "area_id": "outside",
    "name": "Outside",
    "picture": null
  }
}
```
</details>

When you look at the entity data you can for example figure out what you can display using KString e.g. `Area: {area.name}, Device: {device.name_by_user}`

## Development
<details>
  <summary>Click to expand</summary>

```shell
npm install
npm run build
```

Bundeled transpiled code will appear in `dist` directory.

For automatic compilation on detected changes use:
```
npm run watch
```

The `watch` script starts web server exposing dist dir so you can reference the local file in your HA via the following:

```yaml
lovelace:
  resources:
    - url: http://127.0.0.1:5501/dist/battery-state-card.js
      type: module
```

Note: there is "undocumented" `value_override` property on the [entity object](#entity-object) which you can use for testing.

### Testing

```shell
npm run test
```

Or (to see tests coverage report)

```shell
npm run test+coverage
```

Tests in `card` and `entity` directory are e2e tests which run in Electron (headless) browser. All the other tests run in node env (hence they are much faster).

</details>

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
