import React from "react";
import { Button, Modal, Form } from "react-bootstrap";
import { LabeledInput } from "./LabeledInput";

export function CalibrationInputForm({ point, setter, show, onSave }) {
  if (!point) return <></>;
  return (
    <Modal show={show}>
      <Modal.Header>
        <Modal.Title>캘리브레이션 {point?.label} 세팅</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {point?.useX ? (
            <LabeledInput
              label="X"
              value={point.gpsX}
              setValue={setter("gpsX")}></LabeledInput>
          ) : undefined}
          <LabeledInput
            label="Y"
            value={point.gpsY}
            setValue={setter("gpsY")}></LabeledInput>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={onSave}>
          저장
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
