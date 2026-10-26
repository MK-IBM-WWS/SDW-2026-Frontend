import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { Icon } from './Icon';
import { PRICE_STEPS } from '../modules/priceFilter';

interface Props {
  step: number;
  onStepChange: (value: number) => void;
  onApply: () => void;
}

export function PriceFilter({ step, onStepChange, onApply }: Props) {
  return (
    <Form className="filter" onSubmit={(event) => { event.preventDefault(); onApply(); }}>
      <div className="filter__range-wrap">
        <Form.Label className="filter__label" htmlFor="priceStep">
          Максимальная цена: <strong>{PRICE_STEPS[step].label}</strong>
        </Form.Label>
        <div className="filter__controls">
          <Form.Range className="filter__range" id="priceStep" min={0} max={PRICE_STEPS.length - 1} step={1}
            value={step} aria-valuetext={PRICE_STEPS[step].label} onChange={(event) => onStepChange(Number(event.target.value))} />
          <Button className="filter__submit" type="submit" aria-label="Применить фильтр по цене" title="Применить фильтр по цене">
            <Icon name="search" />
          </Button>
        </div>
      </div>
    </Form>
  );
}
