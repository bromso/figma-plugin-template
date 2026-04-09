import {
  Button,
  Checkbox,
  Disclosure,
  DisclosureItem,
  Icon,
  IconButton,
  Input,
  Label,
  OnboardingTip,
  Radio,
  SectionTitle,
  Select,
  SelectMenuOption,
  Switch,
  Textarea,
  Type,
} from './index';

function App() {
  return (
    <div className="overflow-y-auto h-full px-4 py-2">
      <div className="flex flex-col gap-2 mb-6">
        <SectionTitle>Inputs</SectionTitle>
        <Input placeholder="Type something" />
        <Textarea placeholder="Longer text..." rows={3} />
        <Checkbox id="cb1" defaultChecked>Option A</Checkbox>
        <Radio id="r1" name="demo-radio">Option A</Radio>
        <Radio id="r2" name="demo-radio">Option B</Radio>
        <Switch id="sw1" defaultChecked>Enable feature</Switch>
        <Select
          options={[{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }]}
          render={(opt) => (
            <SelectMenuOption key={opt.value} value={opt.value}>
              {opt.label}
            </SelectMenuOption>
          )}
        />
      </div>

      <div className="flex flex-col gap-2 mb-6">
        <SectionTitle>Buttons</SectionTitle>
        <Button tint="primary">Primary action</Button>
        <Button>Secondary action</Button>
        <IconButton iconProps={{ iconName: 'plus' }} aria-label="Add item" />
      </div>

      <div className="flex flex-col gap-2 mb-6">
        <SectionTitle>Display</SectionTitle>
        <Icon iconName="star" />
        <Label>Field label</Label>
        <Type size="large" weight="bold">Heading text</Type>
        <OnboardingTip iconProps={{ iconName: 'info' }}>This is a tip for new users.</OnboardingTip>
      </div>

      <div className="flex flex-col gap-2 mb-6">
        <SectionTitle>Layout</SectionTitle>
        <Disclosure
          tips={[{ heading: 'More info', content: 'Details here.' }]}
          render={(tip) => (
            <DisclosureItem
              key={tip.heading}
              heading={tip.heading}
              content={tip.content}
              expanded
            />
          )}
        />
      </div>
    </div>
  );
}

export default App;
