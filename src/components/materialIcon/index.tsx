import React from "react";

export default function ({
                             name,
                             weight = 300,
                             size = '1rem',
                             color = 'black',
                             opacity = 0.6,
                             styles = {}
                         }) {
    return (
        <span className='material-symbols-outlined'
              style={{
                  fontVariationSettings: `'FILL' 0,
                  'wght' ${weight},
                  'GRAD' -25,
                  'opsz' 24`,
                  fontSize: size,
                  opacity: opacity,
                  color: color,
                  ...styles
              }}
        >{name}</span>
    )
}