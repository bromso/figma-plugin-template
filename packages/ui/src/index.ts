import 'figma-plugin-ds/dist/figma-plugin-ds.css';

// Direct re-exports (names match library)
export { Button } from 'react-figma-ui';
export { Checkbox } from 'react-figma-ui';
export { Disclosure } from 'react-figma-ui';
export { Icon } from 'react-figma-ui';
export { IconButton } from 'react-figma-ui';
export { Input } from 'react-figma-ui';
export { Label } from 'react-figma-ui';
export { SectionTitle } from 'react-figma-ui';
export { Radio } from 'react-figma-ui';
export { Switch } from 'react-figma-ui';
export { Textarea } from 'react-figma-ui';
export { Type } from 'react-figma-ui';

// Aliased re-exports (requirement names differ from library names)
export { DisclosureTip as DisclosureItem } from 'react-figma-ui';
export { Onboarding as OnboardingTip } from 'react-figma-ui';
export { SelectMenu as Select, SelectMenuOption } from 'react-figma-ui';

// Utility (preserved for consumers)
export { classes } from './utils/classes.util';
