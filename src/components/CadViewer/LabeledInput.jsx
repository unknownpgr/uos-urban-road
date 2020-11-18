import React from "react";
import { Form } from "react-bootstrap";

export function LabeledInput({ label, value, setValue }) {
    return (
        <Form.Group>
            <Form.Label>{label}</Form.Label>
            <Form.Control
                onChange={e => setValue(e.target.value)}
                value={value}
                type='number'
            ></Form.Control>
        </Form.Group>
    );
}
