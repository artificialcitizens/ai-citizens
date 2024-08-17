import React, { useState, useEffect } from "react";
import { render, Text } from "ink";
import { ShapesProvider, useShape } from "@electric-sql/react";

export const ElectricWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <ShapesProvider>{children}</ShapesProvider>;
};

const Counter = () => {
  const { data, isUpToDate } = useShape({
    url: `http://localhost:3000/v1/shape/foo`,
  });

  const [user, setUser] = useState(data[0]);

  useEffect(() => {
    setUser(data[0]);
  }, [data]);

  return <Text>{JSON.stringify(user, null, 4)}</Text>;
};

const App = () => (
  <ElectricWrapper>
    <Counter />
  </ElectricWrapper>
);

export const testElectric = () => {
  render(<App />);
};
