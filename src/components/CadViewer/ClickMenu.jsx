import React from 'react';
import { ButtonGroup, Button } from 'react-bootstrap';
import { isSet } from './calibration';
import { mapDict } from 'libs/dictUtil';

export function ClickMenu(props) {
  return (
    <ButtonGroup
      vertical
      className='clickMenu'
      style={{
        display: props.show ? undefined : 'none',
        left: props.x,
        top: props.y,
      }}>
      {mapDict(props.points, (key, point, i) => (
        <Button
          onClick={() => props.onClick(point)}
          key={i}
          variant={isSet(point) ? 'success' : 'primary'}>
          {point.label}
        </Button>
      ))}
    </ButtonGroup>
  );
}
