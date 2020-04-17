import { css } from "./lit-element";

const styles = css`
.battery {
    display: flex;
    line-height: 40px;
}
.battery .name {
    flex: 1 0 60px;
    margin-left: 16px;
}
.battery .icon {
    width: 40px;
    height: 40px;
    flex: 0 0 40px;
}
.battery .icon {
    position: relative;
    display: inline-block;
    width: 40px;
    border-radius: 50%;
    height: 40px;
    text-align: center;
    background-size: cover;
}
.good {
    color: var(--label-badge-green);
}
.warning {
    color: var(--label-badge-yellow);
}
.critical {
    color: var(--label-badge-red);
}
`;

export default styles;