import { describe, expect, it } from 'vitest';
import {
  Button,
  Checkbox,
  Disclosure,
  DisclosureItem,
  Icon,
  IconButton,
  Input,
  Label,
  SectionTitle,
  OnboardingTip,
  Radio,
  Select,
  SelectMenuOption,
  Switch,
  Textarea,
  Type,
  classes,
} from '../index';

describe('@repo/ui exports', () => {
  it('exports all 14 react-figma-ui components', () => {
    expect(Button).toBeDefined();
    expect(Checkbox).toBeDefined();
    expect(Disclosure).toBeDefined();
    expect(DisclosureItem).toBeDefined();
    expect(Icon).toBeDefined();
    expect(IconButton).toBeDefined();
    expect(Input).toBeDefined();
    expect(Label).toBeDefined();
    expect(SectionTitle).toBeDefined();
    expect(OnboardingTip).toBeDefined();
    expect(Radio).toBeDefined();
    expect(Select).toBeDefined();
    expect(Switch).toBeDefined();
    expect(Textarea).toBeDefined();
    expect(Type).toBeDefined();
  });

  it('exports SelectMenuOption companion', () => {
    expect(SelectMenuOption).toBeDefined();
  });

  it('exports classes utility', () => {
    expect(classes).toBeDefined();
    expect(classes('a', 'b')).toBe('a b');
    expect(classes('a', null, 'b')).toBe('a b');
  });
});
