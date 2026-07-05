import type { ReactNode } from "react";

type MockProps = { children?: ReactNode; [key: string]: unknown };

function passthrough(name: string) {
  const Component = ({ children, ...rest }: MockProps) => (
    <div data-testid={name} {...rest}>
      {children}
    </div>
  );
  Component.displayName = `Mock${name}`;
  return Component;
}

export const rechartsMock = {
  ResponsiveContainer: ({ children }: MockProps) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: passthrough("bar-chart"),
  PieChart: passthrough("pie-chart"),
  ComposedChart: passthrough("composed-chart"),
  Bar: passthrough("bar"),
  Pie: passthrough("pie"),
  Line: passthrough("line"),
  Area: passthrough("area"),
  XAxis: passthrough("x-axis"),
  YAxis: passthrough("y-axis"),
  CartesianGrid: passthrough("cartesian-grid"),
  Tooltip: passthrough("tooltip"),
  Legend: passthrough("legend"),
  Cell: passthrough("cell"),
};
