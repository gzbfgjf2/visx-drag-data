import { useData } from "./remote_hook";

const setTableInput = (event, data, i, j, mutate) => {
  event.preventDefault();
  const newState = data.map((row) => row.slice());
  newState[i][j] = parseFloat(event.target.value);
  mutate(newState, { revalidate: false });
};

export function TableInput({ i, j }) {
  const { data, mutate } = useData();
  const value = data[i][j];
  return (
    <input
      value={value.toFixed(3)}
      type="number"
      step="0.001"
      onChange={(event) => setTableInput(event, data, i, j, mutate)}
      className="w-14"
    />
  );
}
