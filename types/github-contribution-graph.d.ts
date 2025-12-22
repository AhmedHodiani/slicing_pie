declare module 'github-contribution-graph' {
  interface Config {
    graphMountElement: string;
    graphTheme?: string;
    graphWidth?: number;
    graphHeight?: number;
    customTheme?: any;
  }

  interface Options {
    data: any;
    ssr?: boolean;
    config: Config;
  }

  export default function drawContributionGraph(options: Options): void;
}
