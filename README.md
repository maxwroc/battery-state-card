# Battery State Card
Devices battery state card for Home Assistant

## Overview

This card was inspired by [another card](https://github.com/cbulock/lovelace-battery-entity) showing the battery states. I have decided to implement my own as there was no response for pull requests and I wanted to fix few things and add couple new features.

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

## Development
```shell
npm install
npm run build
```
Bundeled transpiled code will appear in `dist` directory.
## License