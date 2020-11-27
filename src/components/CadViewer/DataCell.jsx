import React from 'react';

export function DataCell(props) {
  // Return properly formatted data wrapped with <td>
  let item = props.children;
  let str;
  if (typeof item == 'number') {
    if (Number.isInteger(item)) {
      // If integer, just convert to string.
      str = item.toString();
    } else {
      // If float, round to four decimal place.
      // TODO : Update here so that it can be used when item>100.
      str = (item.toString() + '0000').substr(0, 6);
    }
  } else if (item instanceof Date) {
    // If date, convert to local date string
    str = item.toLocaleDateString();
  } else {
    // Else, just convert to string.
    // I used +'' instead of .toString() because item can be 'null' or 'undefined'.
    str = item + '';
  }
  return <td>{props.bold ? <strong>{str}</strong> : str}</td>;
}
