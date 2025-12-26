"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import drawContributionGraph from "github-contribution-graph";
import "./GithubContributionGraph.css";

interface ContributionData {
  [year: string]: {
    date: string;
    done: number;
    not_done?: number;
    value?: number;
    hours?: number;
    money?: number;
  }[];
}

interface Props {
  data: ContributionData;
  id?: string;
  theme?: string;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  date: string;
  count: number;
  hours: number;
  money: number;
}

export default function GithubContributionGraph({ data, id = "contribution-graph", theme = "standard" }: Props) {
  const graphRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, date: "", count: 0, hours: 0, money: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (graphRef.current) {
        // Clear previous graph content
        graphRef.current.innerHTML = "";
        
        try {
            drawContributionGraph({
                data,
                ssr: false,
                config: {
                    graphMountElement: `#${id}`,
                    graphTheme: theme,
                },
            });

            // Attach custom event listeners to rects
            const rects = graphRef.current.querySelectorAll('rect');
            rects.forEach(rect => {
                rect.addEventListener('mouseenter', (e: any) => {
                    const target = e.target as SVGRectElement;
                    const date = target.getAttribute('data-date');
                    
                    if (date) {
                        // Lookup count from data prop instead of DOM attribute
                        let count = 0;
                        let hours = 0;
                        let money = 0;
                        const year = date.split('-')[0];
                        if (data[year]) {
                            const entry = data[year].find(d => d.date === date);
                            if (entry) {
                                count = entry.value !== undefined ? entry.value : entry.done;
                                hours = entry.hours || 0;
                                money = entry.money || 0;
                            }
                        }

                        const rectBox = target.getBoundingClientRect();
                        setTooltip({
                            visible: true,
                            x: rectBox.left + rectBox.width / 2,
                            y: rectBox.top,
                            date: date,
                            count: count,
                            hours: hours,
                            money: money
                        });
                    }
                });

                rect.addEventListener('mouseleave', () => {
                    setTooltip(prev => ({ ...prev, visible: false }));
                });
            });

        } catch (e) {
            console.error("Error drawing contribution graph:", e);
        }
    }
  }, [data, id, theme]);

  return (
    <div className="w-full py-4 github-contribution-graph-wrapper relative">
        <div id={id} ref={graphRef} />
        
        {mounted && tooltip.visible && createPortal(
            <div 
                className="fixed z-[9999] px-3 py-2 rounded shadow-md text-xs pointer-events-none transform -translate-x-1/2 -translate-y-full -mt-2 border border-border bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                style={{ left: tooltip.x, top: tooltip.y }}
            >
                <div className="font-semibold mb-1">{tooltip.date}</div>
                <div>{tooltip.count} slices</div>
                {tooltip.hours > 0 && <div>{tooltip.hours.toFixed(1)} hours</div>}
                {tooltip.money > 0 && <div>JOD {tooltip.money.toFixed(2)}</div>}
            </div>,
            document.body
        )}
    </div>
  );
}
