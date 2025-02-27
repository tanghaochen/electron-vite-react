import React, {useRef} from 'react';
import PropTypes from 'prop-types';
import MaterialIcon from "@/components/materialIcon";

const defaultColors = [
    'transparent',
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FF00FF', '#00FFFF', '#000000', '#808080',
    '#800000', '#808000', '#008000', '#800080',
    '#008080', '#000080', '#FFFFFF',
];

const ColorPickr = ({
                        value = '#008000',
                        colors = defaultColors,
                        icon = '+',
                        onChange = () => {
                        }
                    }) => {
    const handleCustomColorClick = () => {
    };

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: '4px',
            maxWidth: 'calc(34px * 8 + 4px * 7)'
        }}>
            {colors.map((color, index) => {
                const isSelected = color === value;
                const isFirst = index === 0;
                return (
                    <div
                        key={index}
                        onClick={isFirst ? handleCustomColorClick : () => onChange(color)}
                        style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: color,
                            cursor: 'pointer',
                            boxSizing: 'border-box',
                            borderRadius: '4px',
                            margin: '3px',
                            outline: value === color ? '4px solid #2F8EF4' : '2px solid transparent',
                        }}
                    >
                    </div>
                );
            })}
        </div>
    );
};

ColorPickr.propTypes = {
    colors: PropTypes.arrayOf(PropTypes.string),
    icon: PropTypes.node,
    value: PropTypes.string,
    onChange: PropTypes.func
};

export default ColorPickr;