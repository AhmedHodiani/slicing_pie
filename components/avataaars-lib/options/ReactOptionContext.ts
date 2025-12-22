import * as React from 'react';
import OptionContext from './OptionContext';

const ReactOptionContext = React.createContext<OptionContext | null>(null);
export default ReactOptionContext;
