import { useData } from "./remote_hook";
import { useMemo, useRef } from "react";
import { curveLinear } from "@visx/curve";
import { AxisLeft, AxisBottom } from "@visx/axis";
import { scaleOrdinal, scaleThreshold, scaleLinear } from "@visx/scale";
import { schemeDark2 } from "d3-scale-chromatic";
import { Group } from "@visx/group";
import React, { useState } from "react";
import { Bar, Circle, LinePath } from "@visx/shape";
import { Brush as OriginalBrush } from "@visx/brush";
import { create } from "zustand";
import {
  Legend,
  LegendLinear,
  LegendQuantile,
  LegendOrdinal,
  LegendSize,
  LegendThreshold,
  LegendItem,
  LegendLabel,
} from "@visx/legend";
import {
  useTooltip,
  useTooltipInPortal,
  TooltipWithBounds,
  Tooltip,
} from "@visx/tooltip";
import { localPoint } from "@visx/event";
import {
  Annotation,
  LineSubject,
  Label,
  Connector,
  CircleSubject,
  HtmlLabel,
} from "@visx/annotation";

const width = 1000;
const height = 1000;
const margin = { top: 100, bottom: 100, left: 100, right: 100 };

const xMax = width - margin.left - margin.right;
const yMax = height - margin.top - margin.bottom;

const useBarWidth = () => {
  const { data } = useData();
  const barWidth = useMemo(() => xMax / (data[0].length - 1), [data.length]);
  return barWidth;
};
// const annotationWidth = `w-[${barWidth}px]`;
const yDomainMax = 0.2;
const xDomainMax = 10;

const selectedBrushStyle = {
  fill: "rgba(255, 255, 255, 0)",
  stroke: "black",
};
const xScale = scaleLinear({
  range: [margin.left, width - margin.right],
  domain: [0, xDomainMax],
});

const yScale = scaleLinear({
  range: [height - margin.bottom, margin.top],
  domain: [0, yDomainMax],
});

const xAxisScale = scaleLinear({
  range: [margin.left, width - margin.right],
  domain: [0, xDomainMax],
});

const yAxisScale = scaleLinear({
  range: [height - margin.bottom, margin.top],
  domain: [0, yDomainMax],
});

export const range = (n) => [...Array(n).keys()];

function extend(array, n) {
  const timesToRepeat = Math.ceil(n / array.length);
  const extendedArray = new Array(timesToRepeat)
    .fill(array)
    .flatMap((x) => x)
    .slice(0, n);
  return extendedArray;
}
const useColorScale = () => {
  const { data } = useData();
  return useMemo(
    () =>
      scaleOrdinal({
        domain: range(data.length),
        range: extend(schemeDark2, data.length),
      }),
    [data.length],
  );
};

function LinePaths() {
  const { data } = useData();
  const colorScale = useColorScale();
  const { notSelectedRows } = useNotSelectedRowsStore();
  const selectedRowIds = range(data.length).filter(
    (row) => !notSelectedRows.includes(row),
  );
  return (
    <>
      {selectedRowIds.map((rowId, i) => (
        <LinePath
          key={i}
          data={range(data[0].length).map((colId) => [
            colId,
            data[rowId][colId],
          ])}
          curve={curveLinear}
          x={(d) => {
            const res = xScale(d[0]);
            return res;
          }}
          y={(d) => {
            const r = yScale(d[1]);
            return r;
          }}
          stroke={colorScale(rowId)}
          strokeWidth={1}
        />
      ))}
    </>
  );
}

function LegendDemo({ title, children }) {
  return (
    <div className="legend absolute top-24 -right-0 bg-indigo-200 rounded-lg py-2">
      <div className="title ">{title}</div>
      {children}
      <style>{`
        .legend {
          line-height: 0.9em;
          color: black;
          font-size: 10px;
          font-family: arial;
          float: left;

          margin: 5px 5px;
        }
        .title {
          font-size: 12px;
          margin-bottom: 10px;
          font-weight: 100;
        }
      `}</style>
    </div>
  );
}

function Bars({ handleMouseOver, handleMouseOut }) {
  const { data } = useData();
  const barWidth = useBarWidth();
  return range(data[0].length).map((j) => (
    <Group
      key={j}
      left={j * barWidth + margin.left - barWidth / 2}
      top={margin.top}
    >
      {/* <Bar */}
      {/*   key={`bar-${i}`} */}
      {/*   className="hover:fill-blue-300 fill-blue-400" */}
      {/*   width={barWidth} */}
      {/*   height={yMax} */}
      {/*   opacity="0.5" */}
      {/*   onMouseOver={handleMouseOver} */}
      {/*   onMouseOut={handleMouseOut} */}
      {/* /> */}
      <Brush j={j} />
    </Group>
  ));
}

function Circles() {
  const { data } = useData();
  const colorScale = useColorScale();
  const { notSelectedRows } = useNotSelectedRowsStore();
  const selectedRowIds = range(data.length).filter(
    (x) => !notSelectedRows.includes(x),
  );
  return (
    <>
      {selectedRowIds.map((i) =>
        range(data[0].length).map((j) => (
          <circle
            key={`${i}_${j}`}
            cx={xScale(j)}
            cy={yScale(data[i][j])}
            r={3}
            stroke="#575757"
            fill={colorScale(i)}
          />
        )),
      )}
    </>
  );
}

function Brush({ j }) {
  const { data, mutate } = useData();
  const [box, setBox] = useState({});
  const [selection, setSelection] = useState([]);
  const { notSelectedRows } = useNotSelectedRowsStore();
  const brushRef = useRef(null);
  const xScale = useMemo(
    () =>
      scaleLinear({
        range: [0, xMax],
        domain: [0, xDomainMax],
      }),
    [],
  );

  const yScale = useMemo(
    () =>
      scaleLinear({
        range: [yMax, 0],
        domain: [0, yDomainMax],
      }),
    [],
  );

  const onChange = (domain) => {
    if (!domain) return;
    if (selection.length === 0) return;

    const newData = data.map((array) => array.slice());
    const { x0, x1, y0, y1 } = domain;
    const diff = y0 - box.y0;
    selection.forEach((i) => {
      const value = data[i][j];
      const newValue = value + diff;
      newData[i][j] = newValue;
    });
    mutate(newData, { revalidate: false });
    setBox(domain);
  };

  const onClick = () => {
    setSelection([]);
    setBox({});
  };

  const onStart = ({ x, y }) => {
    if (y < box.y0 || box.y1 < y) {
      setSelection([]);
      setBox({});
    }
  };
  const onBrushEnd = (domain) => {
    if (!domain) {
      return;
    }
    if (selection.length !== 0) return;
    const { x0, x1, y0, y1 } = domain;
    setBox(domain);
    let newSelection = [];
    for (let i = 0; i < data.length; i++) {
      const value = data[i][j];
      if (!notSelectedRows.includes(i) && y0 <= value && value <= y1) {
        newSelection.push(i);
      }
    }
    setSelection(newSelection);
  };

  const barWidth = useBarWidth();
  const annotationWidth = `w-[${barWidth}px]`;
  return (
    <>
      <OriginalBrush
        xScale={xScale}
        yScale={yScale}
        width={barWidth}
        height={yMax}
        // brushRegion="yAxis"
        margin={{ left: 0, top: margin.top }}
        handleSize={0}
        innerf={brushRef}
        resizeTriggerAreas={[]}
        brushDirection="vertical"
        onChange={onChange}
        onClick={onClick}
        onBrushEnd={onBrushEnd}
        onBrushStart={onStart}
        selectedBoxStyle={selectedBrushStyle}
        useWindowMoveEvents
        // renderBrushHandle={(props) => <div>hi</div>}
        className="hover:fill-green-300"
      />
      {selection.length !== 0 && (
        <Annotation
          x={0}
          y={yMax - (box.y1 / yDomainMax) * yMax + 3}
          dx={0}
          dy={0}
        >
          <HtmlLabel
            showAnchorLine={false}
            // anchorLineStroke={greens[2]}
            horizontalAnchor="start"
            //verticalAnchor={verticalAnchor}
            // containerStyle={{
            //   width: barWidth,
            //   // height=""
            //   background: "transparent",
            //   border: `1px `,
            //   borderRadius: 5,
            //   // color: greens[2],
            //   fontSize: "0.55em",
            //   lineHeight: "1em",
            //   padding: "0 3em 3px 3px",
            //   fontWeight: 100,
            // }}
            className="text-xs font-mono"
          >
            <div
              className={`flex flex-col bg-violet-500/30 w-[80px] border-violet-900 border p-2`}
            >
              {selection.reverse().map((i) => (
                <div key={i} className="font-light  ">
                  {data[i][j].toFixed(4)}
                </div>
              ))}
            </div>
          </HtmlLabel>
        </Annotation>
      )}
    </>
  );
}

export function Drag(props) {
  console.log("render drag");
  // const {
  //   tooltipData,
  //   tooltipLeft,
  //   tooltipTop,
  //   tooltipOpen,
  //   showTooltip,
  //   hideTooltip,
  // } = useTooltip();
  // const handleMouseOver = (event, datum) => {
  //   console.log("over");
  //   const coords = localPoint(event.target.ownerSVGElement, event);
  //   showTooltip({
  //     tooltipLeft: coords.x,
  //     tooltipTop: coords.y,
  //     tooltipData: datum,
  //   });
  // };
  const colorScale = useColorScale();
  const { notSelectedRows, toggleRow } = useNotSelectedRowsStore();
  return (
    <div className="relative">
      <div>
        <svg width={width} height={height}>
          <rect
            className="fill-blue-100 "
            width="100%"
            height="100%"
            opacity="0.5"
            rx={15}
            ry={15}
          />
          <AxisLeft
            left={margin.left}
            scale={yAxisScale}
            numTicks={10}
            label="value"
            labelClassName={"font-extrabold text-lg"}
          />
          <AxisBottom
            scale={xAxisScale}
            label="column"
            labelClassName={"font-extrabold text-lg"}
            labelOffset={15}
            numTicks={10}
            top={height - margin.bottom}
          />
          <LinePaths />
          <Circles />
          <Bars
          // handleMouseOver={handleMouseOver}
          // handleMouseOut={hideTooltip}
          />
          {/* <text */}
          {/*   x={500} */}
          {/*   y={50} */}
          {/*   fontSize={28} */}
          {/*   fontWeight={900} */}
          {/*   textAnchor="middle" */}
          {/*   fill="#222" */}
          {/* > */}
          {/*   2D data with drag */}
          {/* </text> */}
        </svg>
      </div>
      <LegendDemo title="row selection">
        <LegendOrdinal scale={colorScale}>
          {(labels) =>
            labels.reverse().map((label, i) => (
              <LegendItem
                key={`legend-quantile-${i}`}
                margin="1px 0"
                onClick={(events) => {
                  if (events) toggleRow(label.datum);
                  console.log(notSelectedRows);
                }}
              >
                <svg width={20} height={20}>
                  <rect
                    fill={
                      !notSelectedRows.includes(label.datum)
                        ? label.value
                        : "white"
                    }
                    width={20}
                    height={20}
                  />
                </svg>
                <LegendLabel align="left" margin="2px 0 0 10px">
                  {label.text}
                </LegendLabel>
              </LegendItem>
            ))
          }
        </LegendOrdinal>
      </LegendDemo>
    </div>
  );
}

const useNotSelectedRowsStore = create((set) => ({
  notSelectedRows: [],
  toggleRow: (x) =>
    set((s) => {
      let rows = [...s.notSelectedRows];
      if (rows.includes(x)) {
        rows = rows.filter((y) => y !== x);
      } else {
        rows.push(x);
      }
      rows.sort();
      return { notSelectedRows: rows };
    }),
}));
