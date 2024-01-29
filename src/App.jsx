import "./App.css";
import useSWR, { SWRConfig } from "swr";
import { useData } from "./remote_hook";
import { TableInput } from "./component";
import { Drag, range } from "./graph";

function App() {
  const { isLoading } = useData();
  if (isLoading) return "loading data ...";
  return (
    <>
      <SWRConfig>
        <ControlPanel />
      </SWRConfig>
    </>
  );
}

function ControlPanel() {
  return (
    <div className=" flex flex-col items-center justify-center ">
      <div className=" flex flex-col items-center justify-center gap-3 w-[1000px]">
        <Drag />
        <Table />
      </div>
    </div>
  );
}

function Table() {
  const { data } = useData();
  return (
    <table className=" font-mono bg-red-50 table-fixed text-sm  rtl:text-right text-gray-500 ">
      <caption className="text-lg font-bold font-sans text-black my-3">
        2D data
      </caption>
      <thead className="text-xs text-gray-700 uppercase bg-gray-50 ">
        <tr>
          <th scope="col" className=" px-1 py-1 ">
            <div>column</div>
            <div>row</div>
          </th>
          {range(data[0].length).map((x, i) => (
            <th scope="col" key={i} className="w-24 px-1 py-1 ">
              {x}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {range(data.length).map((x, i) => (
          <tr key={i} className="text-xs text-gray-700 uppercase bg-gray-50 ">
            <th
              scope="row"
              className="px-1 py-2 font-medium text-gray-900 whitespace-nowrap "
            >
              {x}
            </th>
            {range(data[0].length).map((y, j) => (
              <td key={j} className="px-1 py-2 text-center">
                {<TableInput key={`${i}_${j}`} i={i} j={j} />}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default App;
