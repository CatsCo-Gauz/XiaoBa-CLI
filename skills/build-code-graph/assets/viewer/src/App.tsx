import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MarkerType,
  Node,
  Edge,
  EdgeProps,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  ReactFlowInstance,
  getSmoothStepPath,
  useNodes,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import { getSmartEdge, pathfindingJumpPointNoDiagonal } from '@tisoap/react-flow-smart-edge';
import { svgDrawSmoothStepLinePath } from '@tisoap/react-flow-smart-edge';
import {
  ArrowLeft,
  Boxes,
  Braces,
  CheckCircle2,
  ChevronsRight,
  Focus,
  GitBranch,
  Layers3,
  Move,
  PanelRightClose,
  PanelRightOpen,
  Workflow,
  X,
} from 'lucide-react';
import type { AgentCodeGraph, FlowKind, GraphComponent, GraphEdge, InternalStep, Side } from './model';

type CanvasNodeData = {
  eyebrow?: string;
  label: string;
  summary?: string;
  meta?: string;
  accent?: string;
  onOpen?: () => void;
  ports?: PortSpec[];
  tone?: InternalStep['tone'];
};

type CanvasEdgeData = {
  label: string;
  payload?: string;
  kind: FlowKind;
  semantic?: boolean;
  simple?: boolean;
  sourceLabel?: string;
  targetLabel?: string;
};

type PortSpec = {
  id: string;
  type: 'source' | 'target';
  side: Side;
  offset: number;
};

type ViewerCopy = {
  brandSubtitle: string;
  searchPlaceholder: string;
  edgeDensity: string;
  essentialEdges: string;
  allEdges: string;
  graphView: string;
  systemGraph: string;
  components: (count: number) => string;
  contracts: (count: number) => string;
  externalIn: string;
  externalOut: string;
  noInternalFlow: string;
  next: string;
  closeInspector: string;
  component: string;
  contract: string;
  files: string;
  symbols: string;
  references: string;
  keyFiles: string;
  noPayload: string;
  from: string;
  to: string;
  callSites: string;
  semantic: string;
  evidence: string;
  selectEvidence: string;
  schema: string;
  fitGraph: string;
  loadFailed: string;
  loading: string;
  loadingFile: string;
  edgeKinds: Record<FlowKind, string>;
};

const viewerCopy: Record<'zh-CN' | 'en', ViewerCopy> = {
  'zh-CN': {
    brandSubtitle: '智能体代码图',
    searchPlaceholder: '搜索组件或文件',
    edgeDensity: '连线密度',
    essentialEdges: '核心连线',
    allEdges: '全部连线',
    graphView: '图谱视图',
    systemGraph: '系统图',
    components: count => `${count} 个组件`,
    contracts: count => `${count} 条契约`,
    externalIn: '外部输入',
    externalOut: '外部输出',
    noInternalFlow: '尚未记录经审阅的内部流程，请在证据面板中查看文件和符号。',
    next: '下一步',
    closeInspector: '关闭检查面板',
    component: '组件',
    contract: '契约',
    files: '文件',
    symbols: '符号',
    references: '引用',
    keyFiles: '关键文件',
    noPayload: '尚未记录语义载荷。',
    from: '来源',
    to: '去向',
    callSites: '调用点',
    semantic: '语义定义',
    evidence: '证据',
    selectEvidence: '选择组件或连线以查看对应证据。',
    schema: '数据版本',
    fitGraph: '适配画布',
    loadFailed: '图谱加载失败。',
    loading: '正在构建视图。',
    loadingFile: '正在加载 agent-codegraph.json',
    edgeKinds: {
      data: '数据',
      control: '控制',
      async: '异步',
      init: '初始化',
      dependency: '依赖',
    },
  },
  en: {
    brandSubtitle: 'Agent Code Graph',
    searchPlaceholder: 'Find component or file',
    edgeDensity: 'Edge density',
    essentialEdges: 'Essential edges',
    allEdges: 'All edges',
    graphView: 'Graph view',
    systemGraph: 'System graph',
    components: count => `${count} components`,
    contracts: count => `${count} contracts`,
    externalIn: 'EXTERNAL IN',
    externalOut: 'EXTERNAL OUT',
    noInternalFlow: 'No reviewed internal flow is recorded. Inspect files and symbols in the evidence panel.',
    next: 'next',
    closeInspector: 'Close inspector',
    component: 'COMPONENT',
    contract: 'CONTRACT',
    files: 'Files',
    symbols: 'Symbols',
    references: 'References',
    keyFiles: 'Key files',
    noPayload: 'No semantic payload recorded.',
    from: 'From',
    to: 'To',
    callSites: 'Call sites',
    semantic: 'semantic',
    evidence: 'Evidence',
    selectEvidence: 'Select a component or edge to inspect its evidence.',
    schema: 'schema',
    fitGraph: 'Fit graph',
    loadFailed: 'Graph failed to load.',
    loading: 'Building the map.',
    loadingFile: 'Loading agent-codegraph.json',
    edgeKinds: {
      data: 'data',
      control: 'control',
      async: 'async',
      init: 'init',
      dependency: 'dependency',
    },
  },
};

function copyFor(locale?: string) {
  return locale?.toLowerCase().startsWith('en') ? viewerCopy.en : viewerCopy['zh-CN'];
}

const edgeColors: Record<FlowKind, string> = {
  data: '#146f8c',
  control: '#bd5a29',
  async: '#a33878',
  init: '#5568b8',
  dependency: '#66747b',
};

const positions: Record<Side, Position> = {
  left: Position.Left,
  right: Position.Right,
  top: Position.Top,
  bottom: Position.Bottom,
};

function PortSet({ ports }: { ports?: PortSpec[] }) {
  const resolved = ports?.length ? ports : ([
    { id: 'left-in', type: 'target', side: 'left', offset: 42 },
    { id: 'left-out', type: 'source', side: 'left', offset: 62 },
    { id: 'right-in', type: 'target', side: 'right', offset: 42 },
    { id: 'right-out', type: 'source', side: 'right', offset: 62 },
    { id: 'top-in', type: 'target', side: 'top', offset: 42 },
    { id: 'top-out', type: 'source', side: 'top', offset: 62 },
    { id: 'bottom-in', type: 'target', side: 'bottom', offset: 42 },
    { id: 'bottom-out', type: 'source', side: 'bottom', offset: 62 },
  ] satisfies PortSpec[]);
  return (
    <>
      {resolved.map(port => (
        <Handle
          key={port.id}
          id={port.id}
          type={port.type}
          position={positions[port.side]}
          className={`port port-${port.side} port-${port.type === 'source' ? 'out' : 'in'}`}
          style={port.side === 'left' || port.side === 'right'
            ? { top: `${port.offset}%` }
            : { left: `${port.offset}%` }}
        />
      ))}
    </>
  );
}

function ComponentNode({ data }: { data: CanvasNodeData }) {
  return (
    <article className="component-node" style={{ '--node-accent': data.accent || '#2f7a78' } as React.CSSProperties}>
      <PortSet ports={data.ports} />
      <div className="node-eyebrow">{data.eyebrow}</div>
      <div className="node-heading">
        <h3>{data.label}</h3>
        {data.onOpen && (
          <button type="button" title={`Open ${data.label}`} onClick={data.onOpen}>
            <ChevronsRight size={18} />
          </button>
        )}
      </div>
      {data.summary && <p className="node-summary">{data.summary}</p>}
      {data.meta && <div className="node-meta">{data.meta}</div>}
    </article>
  );
}

function GroupNode({ data }: { data: CanvasNodeData }) {
  return (
    <section className="zone-node" style={{ '--zone-accent': data.accent || '#708087' } as React.CSSProperties}>
      <div className="zone-heading">
        <span>{data.eyebrow}</span>
        <strong>{data.label}</strong>
        {data.summary && <small>{data.summary}</small>}
        <Move size={14} />
      </div>
    </section>
  );
}

function StepNode({ data }: { data: CanvasNodeData }) {
  return (
    <article className={`process-node tone-${data.tone || 'process'}`}>
      <PortSet ports={data.ports} />
      <span className="process-index">{data.eyebrow}</span>
      <strong>{data.label}</strong>
      {data.summary && <span>{data.summary}</span>}
      {data.meta && <code>{data.meta}</code>}
      {data.onOpen && (
        <button className="node-open" type="button" title={`Open ${data.label}`} onClick={data.onOpen}>
          <ChevronsRight size={18} />
        </button>
      )}
    </article>
  );
}

function BoundaryNode({ data }: { data: CanvasNodeData }) {
  return (
    <article className="boundary-node">
      <PortSet ports={data.ports} />
      <span>{data.eyebrow}</span>
      <h3>{data.label}</h3>
      {data.summary && <p>{data.summary}</p>}
    </article>
  );
}

const drawRoutedEdge = svgDrawSmoothStepLinePath({ borderRadius: 10 });

function absoluteRoutingNodes(nodes: Node[]) {
  const nodeById = new Map(nodes.map(node => [node.id, node]));
  return nodes
    .map(node => {
      let x = node.position.x;
      let y = node.position.y;
      let parentId = node.parentId;
      const visited = new Set([node.id]);
      while (parentId && !visited.has(parentId)) {
        visited.add(parentId);
        const parent = nodeById.get(parentId);
        if (!parent) break;
        x += parent.position.x;
        y += parent.position.y;
        parentId = parent.parentId;
      }
      return { ...node, position: { x, y } };
    })
    .filter(node => node.type !== 'group');
}

function compactRoutePoints(
  source: { x: number; y: number },
  target: { x: number; y: number },
  routePoints: number[][],
) {
  const raw = [source, ...routePoints.map(([x, y]) => ({ x, y })), target];
  const points = raw.filter((point, index) =>
    index === 0 || point.x !== raw[index - 1].x || point.y !== raw[index - 1].y,
  );
  return points.reduce<Array<{ x: number; y: number }>>((result, point) => {
    if (result.length < 2) return [...result, point];
    const previous = result[result.length - 1];
    const before = result[result.length - 2];
    const sameAxis = (before.x === previous.x && previous.x === point.x)
      || (before.y === previous.y && previous.y === point.y);
    return sameAxis ? [...result.slice(0, -1), point] : [...result, point];
  }, []);
}

function edgeLaneOffset(edgeId: string) {
  const seed = [...edgeId].reduce((value, character) =>
    ((value * 33) + character.charCodeAt(0)) >>> 0, 11,
  );
  return [-10, -6, -2, 2, 6, 10][seed % 6];
}

function parallelRoutePoints(
  edgeId: string,
  source: { x: number; y: number },
  target: { x: number; y: number },
  routePoints: number[][],
) {
  const route = compactRoutePoints(source, target, routePoints);
  if (route.length < 2) return routePoints;
  const offset = edgeLaneOffset(edgeId);
  const first = route[0];
  const second = route[1];
  const beforeTarget = route[route.length - 2];
  const last = route[route.length - 1];
  const firstHorizontal = first.y === second.y;
  const lastHorizontal = beforeTarget.y === last.y;
  const startDirection = firstHorizontal ? Math.sign(second.x - first.x) : Math.sign(second.y - first.y);
  const endDirection = lastHorizontal ? Math.sign(last.x - beforeTarget.x) : Math.sign(last.y - beforeTarget.y);
  const stub = 14;
  const result: Array<{ x: number; y: number }> = [];

  if (firstHorizontal) {
    result.push({ x: first.x + startDirection * stub, y: first.y });
    result.push({ x: first.x + startDirection * stub, y: first.y + offset });
  } else {
    result.push({ x: first.x, y: first.y + startDirection * stub });
    result.push({ x: first.x + offset, y: first.y + startDirection * stub });
  }
  route.slice(1, -1).forEach(point => result.push({ x: point.x + offset, y: point.y + offset }));
  if (lastHorizontal) {
    result.push({ x: last.x - endDirection * stub, y: last.y + offset });
    result.push({ x: last.x - endDirection * stub, y: last.y });
  } else {
    result.push({ x: last.x + offset, y: last.y - endDirection * stub });
    result.push({ x: last.x, y: last.y - endDirection * stub });
  }
  return result.map(point => [point.x, point.y]);
}

function routeLabelPosition(
  edgeId: string,
  source: { x: number; y: number },
  target: { x: number; y: number },
  routePoints: number[][],
) {
  const compressed = compactRoutePoints(source, target, routePoints);
  const segments = compressed.slice(0, -1).map((start, index) => {
    const end = compressed[index + 1];
    const horizontal = start.y === end.y;
    const length = Math.abs(end.x - start.x) + Math.abs(end.y - start.y);
    const endpointPenalty = index === 0 || index === compressed.length - 2 ? 0.62 : 1;
    return { start, end, horizontal, score: length * endpointPenalty * (horizontal ? 1.12 : 1) };
  });
  const best = segments.sort((a, b) => b.score - a.score)[0];
  if (!best) return { x: (source.x + target.x) / 2, y: (source.y + target.y) / 2 };
  const seed = [...edgeId].reduce((value, character) =>
    ((value * 31) + character.charCodeAt(0)) >>> 0, 7,
  );
  const fraction = [0.36, 0.5, 0.64][seed % 3];
  const normalOffset = (seed % 2 === 0 ? 1 : -1) * 17;
  const x = best.start.x + (best.end.x - best.start.x) * fraction;
  const y = best.start.y + (best.end.y - best.start.y) * fraction;
  return best.horizontal ? { x, y: y + normalOffset } : { x: x + normalOffset, y };
}

function SmartContractEdge(props: EdgeProps<Edge<CanvasEdgeData>>) {
  const nodes = absoluteRoutingNodes(useNodes());
  const color = edgeColors[props.data?.kind || 'dependency'];
  const fallback = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
    borderRadius: 10,
    offset: 34,
  });
  const smart = props.data?.simple ? null : getSmartEdge({
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    nodes,
    options: {
      gridRatio: 8,
      nodePadding: 32,
      generatePath: pathfindingJumpPointNoDiagonal,
      drawEdge: drawRoutedEdge,
    },
  });
  const routed = !smart || smart instanceof Error ? null : smart;
  const sourcePoint = { x: props.sourceX, y: props.sourceY };
  const targetPoint = { x: props.targetX, y: props.targetY };
  const lanePoints = routed ? parallelRoutePoints(props.id, sourcePoint, targetPoint, routed.points) : [];
  const path = routed ? drawRoutedEdge(sourcePoint, targetPoint, lanePoints) : fallback[0];
  const labelPosition = routed
    ? routeLabelPosition(props.id, sourcePoint, targetPoint, lanePoints)
    : { x: fallback[1], y: fallback[2] };
  const labelX = labelPosition.x;
  const labelY = labelPosition.y;

  return (
    <>
      <BaseEdge
        id={props.id}
        path={path}
        markerEnd={props.markerEnd}
        style={{ ...props.style, stroke: color, strokeWidth: 2.2 }}
      />
      {props.data?.semantic && (
        <EdgeLabelRenderer>
          <div
            className={`edge-contract kind-${props.data?.kind || 'dependency'} nodrag nopan`}
            title={props.data?.payload || props.data?.label}
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 15}px)` }}
          >
            <strong>{props.data?.label}</strong>
            {(props.data?.sourceLabel || props.data?.targetLabel) && (
              <small className="edge-route-label">
                {props.data?.sourceLabel || props.source} → {props.data?.targetLabel || props.target}
              </small>
            )}
            {props.data?.payload && <code>{props.data.payload}</code>}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const nodeTypes = {
  component: ComponentNode,
  group: GroupNode,
  step: StepNode,
  boundary: BoundaryNode,
};
const edgeTypes = { contract: SmartContractEdge };

function ordered<T extends { id: string }>(items: T[], ids: string[] = []) {
  const rank = new Map(ids.map((id, index) => [id, index]));
  return [...items].sort((a, b) =>
    (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER) ||
    a.id.localeCompare(b.id),
  );
}

function chooseSides(source: { x: number; y: number }, target: { x: number; y: number }): [Side, Side] {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? ['right', 'left'] : ['left', 'right'];
  return dy >= 0 ? ['bottom', 'top'] : ['top', 'bottom'];
}

function graphEdge(edge: GraphEdge, centers: Map<string, { x: number; y: number }>, overrides: AgentCodeGraph['layout']['edgeOverrides'] = {}): Edge<CanvasEdgeData> {
  const inferred = chooseSides(centers.get(edge.source) || { x: 0, y: 0 }, centers.get(edge.target) || { x: 1, y: 0 });
  const override = overrides[edge.id] || {};
  const sourceSide = override.sourceSide || inferred[0];
  const targetSide = override.targetSide || inferred[1];
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: `${sourceSide}-out`,
    targetHandle: `${targetSide}-in`,
    type: 'contract',
    markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors[edge.kind] },
    data: { label: edge.label, payload: edge.payload, kind: edge.kind, semantic: edge.semantic },
  };
}

function assignUniquePorts(nodes: Node<CanvasNodeData>[], edges: Edge<CanvasEdgeData>[]) {
  const buckets = new Map<string, Array<{ edgeId: string; type: 'source' | 'target'; side: Side; handleId: string }>>();
  const updatedEdges = edges.map(edge => {
    const sourceSide = String(edge.sourceHandle || 'right-out').split('-')[0] as Side;
    const targetSide = String(edge.targetHandle || 'left-in').split('-')[0] as Side;
    const sourceHandle = `port:${edge.id}:out`;
    const targetHandle = `port:${edge.id}:in`;
    const sourceKey = `${edge.source}:${sourceSide}`;
    const targetKey = `${edge.target}:${targetSide}`;
    if (!buckets.has(sourceKey)) buckets.set(sourceKey, []);
    if (!buckets.has(targetKey)) buckets.set(targetKey, []);
    buckets.get(sourceKey)!.push({ edgeId: edge.id, type: 'source', side: sourceSide, handleId: sourceHandle });
    buckets.get(targetKey)!.push({ edgeId: edge.id, type: 'target', side: targetSide, handleId: targetHandle });
    return { ...edge, sourceHandle, targetHandle };
  });

  const portsByNode = new Map<string, PortSpec[]>();
  for (const [bucketKey, entries] of buckets) {
    const separator = bucketKey.lastIndexOf(':');
    const nodeId = bucketKey.slice(0, separator);
    const sorted = [...entries].sort((a, b) => a.edgeId.localeCompare(b.edgeId) || a.type.localeCompare(b.type));
    const ports = portsByNode.get(nodeId) || [];
    sorted.forEach((entry, index) => {
      ports.push({
        id: entry.handleId,
        type: entry.type,
        side: entry.side,
        offset: 18 + (64 * (index + 1)) / (sorted.length + 1),
      });
    });
    portsByNode.set(nodeId, ports);
  }

  return {
    nodes: nodes.map(node => {
      const ports = portsByNode.get(node.id);
      return ports ? { ...node, data: { ...node.data, ports } } : node;
    }),
    edges: updatedEdges,
  };
}

function buildSystemGraph(graph: AgentCodeGraph, visibleEdges: GraphEdge[], open: (component: GraphComponent) => void) {
  const groups = ordered(graph.groups, graph.layout.groupOrder);
  const components = ordered(graph.components, graph.layout.componentOrder);
  const nodes: Node<CanvasNodeData>[] = [];
  const centers = new Map<string, { x: number; y: number }>();
  const palette = ['#4c9fc2', '#d28a3f', '#8b70c1', '#4f9a71', '#9b4076', '#5c7f37'];
  const layouts = groups.map((group, groupIndex) => {
    const members = components.filter(component => component.group === group.id);
    const columns = Math.max(1, Math.ceil(Math.sqrt(members.length)));
    const rows = Math.max(1, Math.ceil(members.length / columns));
    return {
      group,
      members,
      columns,
      width: columns * 290 + 70,
      height: rows * 170 + 100,
      accent: palette[groupIndex % palette.length],
    };
  });

  const useAtlasLayout = layouts.length === 4
    && layouts[0].members.length <= 2
    && layouts[1].members.length <= 4
    && layouts[2].members.length <= 2
    && layouts[3].members.length <= 4;
  const atlasFrames = [
    { x: 0, y: 0, width: 650, height: 330, columns: 2, gapX: 330, gapY: 280, startX: 35, startY: 110 },
    { x: 720, y: 0, width: 740, height: 590, columns: 2, gapX: 380, gapY: 280, startX: 40, startY: 110 },
    { x: 1530, y: 0, width: 330, height: 590, columns: 1, gapX: 0, gapY: 280, startX: 45, startY: 110 },
    { x: 220, y: 680, width: 1640, height: 350, columns: 4, gapX: 400, gapY: 0, startX: 45, startY: 125 },
  ];
  const groupColumns = graph.layout.direction === 'TB'
    ? 1
    : Math.min(3, Math.max(1, Math.ceil(Math.sqrt(layouts.length * 1.5))));
  const groupRows = Math.ceil(layouts.length / groupColumns);
  const columnWidths = Array.from({ length: groupColumns }, (_, column) =>
    Math.max(...layouts.filter((_, index) => index % groupColumns === column).map(item => item.width), 0),
  );
  const rowHeights = Array.from({ length: groupRows }, (_, row) =>
    Math.max(...layouts.slice(row * groupColumns, (row + 1) * groupColumns).map(item => item.height), 0),
  );
  layouts.forEach(({ group, members, columns, width, height, accent }, groupIndex) => {
    const column = groupIndex % groupColumns;
    const row = Math.floor(groupIndex / groupColumns);
    const fallbackX = 70 + columnWidths.slice(0, column).reduce((total, value) => total + value + 80, 0);
    const fallbackY = 70 + rowHeights.slice(0, row).reduce((total, value) => total + value + 80, 0);
    const frame = useAtlasLayout
      ? atlasFrames[groupIndex]
      : {
          x: fallbackX,
          y: fallbackY,
          width,
          height,
          columns,
          gapX: 290,
          gapY: 170,
          startX: 35,
          startY: 78,
        };
    nodes.push({
      id: `group:${group.id}`,
      type: 'group',
      position: { x: frame.x, y: frame.y },
      data: { eyebrow: String(groupIndex + 1).padStart(2, '0'), label: group.label, summary: group.summary, accent },
      style: { width: frame.width, height: frame.height, zIndex: -1 },
      selectable: false,
      draggable: true,
    });
    members.forEach((component, index) => {
      const col = index % frame.columns;
      const memberRow = Math.floor(index / frame.columns);
      const local = {
        x: frame.startX + col * frame.gapX,
        y: frame.startY + memberRow * frame.gapY,
      };
      nodes.push({
        id: component.id,
        type: 'component',
        parentId: `group:${group.id}`,
        extent: 'parent',
        position: local,
        data: {
          eyebrow: component.id,
          label: component.label,
          summary: component.summary,
          meta: `${component.stats.files} files · ${component.stats.symbols} symbols`,
          accent,
          onOpen: () => open(component),
        },
        style: { width: 240, height: 116 },
      });
      centers.set(component.id, { x: frame.x + local.x + 120, y: frame.y + local.y + 58 });
    });
  });

  return assignUniquePorts(
    nodes,
    visibleEdges.map(edge => graphEdge(edge, centers, graph.layout.edgeOverrides)),
  );
}

function buildDetailGraph(
  graph: AgentCodeGraph,
  visibleEdges: GraphEdge[],
  component: GraphComponent,
  copy: ViewerCopy,
  scope?: InternalStep,
  scopeKey = 'root',
  openStep?: (step: InternalStep) => void,
) {
  const atRoot = !scope;
  const inbound = atRoot ? visibleEdges.filter(edge => edge.target === component.id) : [];
  const outbound = atRoot ? visibleEdges.filter(edge => edge.source === component.id) : [];
  const semanticSteps = scope?.children || component.internalSteps;
  const explicitInternalEdges = scope?.internalEdges || component.internalEdges;
  const hasSemanticSteps = semanticSteps.length > 0;
  const steps: InternalStep[] = hasSemanticSteps
    ? semanticSteps
    : [{
        id: 'component-boundary',
        label: scope?.label || component.label,
        summary: copy.noInternalFlow,
      }];
  const nodes: Node<CanvasNodeData>[] = [];
  const centers = new Map<string, { x: number; y: number }>();
  const columns = Math.min(3, Math.max(1, steps.length));
  const rows = Math.ceil(steps.length / columns);
  const focusOrigin = { x: 460, y: 40 };
  const focusWidth = columns * 350 + 30;
  const focusHeight = rows * 210 + 110;
  const scopedId = (stepId: string) => `${component.id}:${scopeKey}:${stepId}`;

  nodes.push({
    id: 'focus-zone',
    type: 'group',
    position: focusOrigin,
    data: {
      eyebrow: component.id,
      label: scope?.label || component.label,
      summary: scope ? 'LOCAL SUBGRAPH' : 'LOCAL INTERNAL EXPANSION',
      accent: '#d28a3f',
    },
    style: { width: focusWidth, height: focusHeight, zIndex: -1 },
    selectable: false,
    draggable: true,
  });

  steps.forEach((step, index) => {
    const row = Math.floor(index / columns);
    const logicalColumn = index % columns;
    const col = row % 2 === 0 ? logicalColumn : columns - 1 - logicalColumn;
    const local = { x: 30 + col * 350, y: 78 + row * 210 };
    const id = scopedId(step.id);
    nodes.push({
      id,
      type: 'step',
      parentId: 'focus-zone',
      extent: 'parent',
      position: local,
      data: {
        eyebrow: String(index + 1).padStart(2, '0'),
        label: step.label,
        summary: step.summary,
        meta: [step.file, step.symbol].filter(Boolean).join(' / '),
        tone: step.tone,
        onOpen: step.children?.length && openStep ? () => openStep(step) : undefined,
      },
      style: { width: 310, height: 154 },
    });
    centers.set(id, {
      x: focusOrigin.x + local.x + 155,
      y: focusOrigin.y + local.y + 77,
    });
  });

  const edges: Edge<CanvasEdgeData>[] = [];
  const internalEdges = explicitInternalEdges.length > 0
    ? explicitInternalEdges
    : hasSemanticSteps
      ? steps.slice(0, -1).map((step, index) => ({
          source: step.id,
          target: steps[index + 1].id,
          label: copy.next,
          kind: 'control' as FlowKind,
        }))
      : [];

  internalEdges.forEach((edge, index) => {
    const source = scopedId(edge.source);
    const target = scopedId(edge.target);
    if (!centers.has(source) || !centers.has(target)) return;
    const [sourceSide, targetSide] = chooseSides(centers.get(source)!, centers.get(target)!);
    const kind = edge.kind || 'data';
    edges.push({
      id: `internal:${scopeKey}:${index}:${edge.source}:${edge.target}`,
      source,
      target,
      sourceHandle: `${sourceSide}-out`,
      targetHandle: `${targetSide}-in`,
      type: 'contract',
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors[kind] },
      style: {
        stroke: edgeColors[kind],
        strokeWidth: kind === 'data' ? 2.4 : 1.8,
        strokeDasharray: kind === 'async' ? '7 6' : undefined,
      },
      animated: kind === 'async',
      data: { label: edge.label || '', kind, semantic: true, simple: true },
    });
  });

  inbound.forEach((edge, index) => {
    const id = `in:${edge.id}`;
    const position = { x: 70, y: 110 + index * 170 };
    nodes.push({
      id,
      type: 'boundary',
      position,
      data: {
        eyebrow: copy.externalIn,
        label: graph.components.find(item => item.id === edge.source)?.label || edge.source,
        summary: edge.payload || edge.label,
      },
      style: { width: 300, height: 126 },
    });
    centers.set(id, { x: position.x + 150, y: position.y + 63 });
    const targetStep = steps.find(step => step.id === edge.targetStep) || steps[0];
    if (targetStep) {
      const target = scopedId(targetStep.id);
      const [sourceSide, targetSide] = chooseSides(centers.get(id)!, centers.get(target)!);
      edges.push({
        ...graphEdge({ ...edge, source: id, target }, centers),
        id: `detail:${edge.id}:in`,
        sourceHandle: `${sourceSide}-out`,
        targetHandle: `${targetSide}-in`,
      });
    }
  });

  outbound.forEach((edge, index) => {
    const id = `out:${edge.id}`;
    const position = { x: focusOrigin.x + focusWidth + 100, y: 110 + index * 170 };
    nodes.push({
      id,
      type: 'boundary',
      position,
      data: {
        eyebrow: copy.externalOut,
        label: graph.components.find(item => item.id === edge.target)?.label || edge.target,
        summary: edge.payload || edge.label,
      },
      style: { width: 300, height: 126 },
    });
    centers.set(id, { x: position.x + 150, y: position.y + 63 });
    const sourceStep = steps.find(step => step.id === edge.sourceStep) || steps.slice(-1)[0];
    if (sourceStep) {
      const source = scopedId(sourceStep.id);
      const [sourceSide, targetSide] = chooseSides(centers.get(source)!, centers.get(id)!);
      edges.push({
        ...graphEdge({ ...edge, source, target: id }, centers),
        id: `detail:${edge.id}:out`,
        sourceHandle: `${sourceSide}-out`,
        targetHandle: `${targetSide}-in`,
      });
    }
  });

  return assignUniquePorts(nodes, edges);
}

function buildFlowGraph(graph: AgentCodeGraph, flowId: string, copy: ViewerCopy) {
  const flow = graph.flows.find(item => item.id === flowId);
  if (!flow) return { nodes: [], edges: [] };
  const components = new Map(graph.components.map(component => [component.id, component]));
  const nodes: Node<CanvasNodeData>[] = [];
  const edges: Edge<CanvasEdgeData>[] = [];
  const centers = new Map<string, { x: number; y: number }>();

  flow.steps.forEach((flowStep, index) => {
    const component = components.get(flowStep.component);
    const internal = component?.internalSteps.find(step => step.id === flowStep.step);
    const id = `flow:${flow.id}:${index}`;
    const position = {
      x: 100 + index * 370,
      y: 180 + (index % 2) * 190,
    };
    nodes.push({
      id,
      type: 'step',
      position,
      data: {
        eyebrow: `${flow.kind} · ${String(index + 1).padStart(2, '0')}`,
        label: flowStep.label || internal?.label || component?.label || flowStep.component,
        summary: internal?.summary || component?.summary,
        meta: [internal?.file, internal?.symbol].filter(Boolean).join(' / '),
      },
      style: { width: 310, height: 154 },
    });
    centers.set(id, { x: position.x + 155, y: position.y + 77 });
  });

  for (let index = 0; index < flow.steps.length - 1; index += 1) {
    const source = `flow:${flow.id}:${index}`;
    const target = `flow:${flow.id}:${index + 1}`;
    const [sourceSide, targetSide] = chooseSides(centers.get(source)!, centers.get(target)!);
    edges.push({
      id: `flow-edge:${flow.id}:${index}`,
      source,
      target,
      sourceHandle: `${sourceSide}-out`,
      targetHandle: `${targetSide}-in`,
      type: 'contract',
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.control },
      data: { label: copy.next, kind: 'control', semantic: true, simple: true },
    });
  }
  return assignUniquePorts(nodes, edges);
}

function Inspector({ graph, edge, component, copy, onClose }: {
  graph: AgentCodeGraph;
  edge?: GraphEdge;
  component?: GraphComponent;
  copy: ViewerCopy;
  onClose: () => void;
}) {
  return (
    <aside className="inspector">
      <button type="button" className="icon-button close" title={copy.closeInspector} onClick={onClose}><X size={18} /></button>
      {component && (
        <>
          <div className="inspector-kicker">{copy.component}</div>
          <h2>{component.label}</h2>
          <p>{component.summary}</p>
          <dl>
            <div><dt>{copy.files}</dt><dd>{component.stats.files}</dd></div>
            <div><dt>{copy.symbols}</dt><dd>{component.stats.symbols}</dd></div>
            <div><dt>{copy.references}</dt><dd>{component.stats.references}</dd></div>
          </dl>
          <h3>{copy.keyFiles}</h3>
          <ul>{component.files.slice(0, 8).map(file => <li key={file.path}><code>{file.path}</code></li>)}</ul>
        </>
      )}
      {edge && (
        <>
          <div className="inspector-kicker">{copy.contract} · {copy.edgeKinds[edge.kind]}</div>
          <h2>{edge.label}</h2>
          <p>{edge.payload || copy.noPayload}</p>
          <dl>
            <div><dt>{copy.from}</dt><dd>{edge.source}</dd></div>
            <div><dt>{copy.to}</dt><dd>{edge.target}</dd></div>
            <div><dt>{copy.callSites}</dt><dd>{edge.static?.callSites ?? copy.semantic}</dd></div>
          </dl>
          <h3>{copy.evidence}</h3>
          <ul>{edge.static?.evidence.slice(0, 6).map((sample, index) => (
            <li key={index}><code>{sample.from.file}/{sample.from.symbol}</code><br />{copy.to}<br /><code>{sample.to.file}/{sample.to.symbol}</code></li>
          ))}</ul>
        </>
      )}
      {!component && !edge && <p>{copy.selectEvidence}</p>}
      <footer>{graph.project.name} · {copy.schema} {graph.schemaVersion}</footer>
    </aside>
  );
}

export default function App() {
  const [graph, setGraph] = useState<AgentCodeGraph | null>(null);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<GraphComponent | null>(null);
  const [detailPath, setDetailPath] = useState<InternalStep[]>([]);
  const [activeFlow, setActiveFlow] = useState('');
  const [edgeMode, setEdgeMode] = useState<'essential' | 'all'>('essential');
  const [inspectedComponent, setInspectedComponent] = useState<GraphComponent>();
  const [inspectedEdge, setInspectedEdge] = useState<GraphEdge>();
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [renderNodes, setRenderNodes, onNodesChange] = useNodesState<Node<CanvasNodeData>>([]);
  const [renderEdges, setRenderEdges, onEdgesChange] = useEdgesState<Edge<CanvasEdgeData>>([]);
  const flowInstance = useRef<ReactFlowInstance<Node<CanvasNodeData>, Edge<CanvasEdgeData>> | null>(null);
  const copy = useMemo(() => copyFor(graph?.project.locale), [graph?.project.locale]);

  useEffect(() => {
    fetch('/agent-codegraph.json')
      .then(response => {
        if (!response.ok) throw new Error(`agent-codegraph.json (${response.status})`);
        return response.json();
      })
      .then(setGraph)
      .catch(errorValue => setError(errorValue.message));
  }, []);

  const openComponent = useCallback((component: GraphComponent) => {
    setActiveFlow('');
    setDetail(component);
    setDetailPath([]);
    setInspectedComponent(component);
    setInspectedEdge(undefined);
  }, []);

  const openNestedStep = useCallback((step: InternalStep) => {
    setDetailPath(path => [...path, step]);
  }, []);

  const visibleEdges = useMemo(() => {
    if (!graph || edgeMode === 'all') return graph?.edges || [];
    const semantic = graph.edges.filter(edge => edge.semantic);
    const selected = new Map(semantic.map(edge => [edge.id, edge]));
    const automaticLimit = Math.min(24, Math.max(12, Math.ceil(graph.components.length * 0.9)));
    const limit = Math.max(automaticLimit, semantic.length);
    for (const edge of [...graph.edges].sort((a, b) =>
      (b.static?.totalWeight || 0) - (a.static?.totalWeight || 0),
    )) {
      if (selected.size >= limit) break;
      selected.set(edge.id, edge);
    }
    return [...selected.values()];
  }, [graph, edgeMode]);

  const canvas = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] };
    if (detail) {
      const scope = detailPath.at(-1);
      const scopeKey = detailPath.map(step => step.id).join(':') || 'root';
      return buildDetailGraph(graph, visibleEdges, detail, copy, scope, scopeKey, openNestedStep);
    }
    if (activeFlow) return buildFlowGraph(graph, activeFlow, copy);
    return buildSystemGraph(graph, visibleEdges, openComponent);
  }, [graph, detail, detailPath, activeFlow, visibleEdges, openComponent, openNestedStep, copy]);

  useEffect(() => {
    setRenderNodes(canvas.nodes);
    setRenderEdges(canvas.edges);
    window.requestAnimationFrame(() => {
      flowInstance.current?.fitView({ padding: 0.12, maxZoom: 1 });
    });
  }, [canvas, setRenderEdges, setRenderNodes]);

  if (error) return <main className="status"><strong>{copy.loadFailed}</strong><span>{error}</span></main>;
  if (!graph) return <main className="status"><strong>{copy.loading}</strong><span>{copy.loadingFile}</span></main>;

  const activeFlowMeta = graph.flows.find(flow => flow.id === activeFlow);
  const focusedStep = detailPath.at(-1);
  const title = focusedStep?.label || detail?.label || activeFlowMeta?.label || graph.project.name;
  const kicker = detail
    ? focusedStep ? 'NESTED SUBGRAPH' : 'COMPONENT INTERNALS'
    : activeFlowMeta ? activeFlowMeta.kind.toUpperCase() : 'SYSTEM TOPOLOGY';

  const goBack = () => {
    if (detailPath.length > 0) {
      setDetailPath(path => path.slice(0, -1));
      return;
    }
    setDetail(null);
    setActiveFlow('');
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark"><Braces size={19} /></div>
          <div><strong>{graph.project.name}</strong><span>{copy.brandSubtitle}</span></div>
        </div>
        <nav className="view-tabs" aria-label={copy.graphView}>
          <button
            className={!activeFlow ? 'active' : ''}
            type="button"
            onClick={() => {
              setDetail(null);
              setDetailPath([]);
              setActiveFlow('');
            }}
          >
            <Boxes size={16} />{copy.systemGraph}
          </button>
          {graph.flows.map(flow => (
            <button
              key={flow.id}
              className={activeFlow === flow.id ? 'active' : ''}
              type="button"
              onClick={() => {
                setDetail(null);
                setDetailPath([]);
                setActiveFlow(flow.id);
              }}
            >
              <Workflow size={16} />{flow.label}
            </button>
          ))}
        </nav>
        <div className="verified">
          <CheckCircle2 size={15} />
          <span>{copy.components(graph.components.length)} · {copy.contracts(graph.edges.length)}</span>
        </div>
      </header>

      <main className={`workspace ${inspectorOpen ? '' : 'inspector-closed'}`}>
        <section className="graph-stage">
          <div className="graph-titlebar">
            <div>
              {(detail || activeFlow) ? (
                <button className="back-button" type="button" onClick={goBack} title={copy.systemGraph}>
                  <ArrowLeft size={17} />
                </button>
              ) : <span className="view-icon"><Layers3 size={17} /></span>}
              <div>
                <span>{kicker}</span>
                <h1>{title}</h1>
              </div>
            </div>
            <div className="title-actions">
              <select
                className="edge-mode-select"
                aria-label={copy.edgeDensity}
                value={edgeMode}
                onChange={event => setEdgeMode(event.target.value as 'essential' | 'all')}
              >
                <option value="essential">{copy.essentialEdges}</option>
                <option value="all">{copy.allEdges}</option>
              </select>
              {!detail && !activeFlow && (
                <span className="port-legend">
                  <i className="port-in" />IN
                  <i className="port-out" />OUT
                </span>
              )}
              <button
                className="inspector-toggle"
                type="button"
                onClick={() => setInspectorOpen(value => !value)}
                title={inspectorOpen ? copy.closeInspector : copy.selectEvidence}
              >
                {inspectorOpen ? <PanelRightClose size={17} /> : <PanelRightOpen size={17} />}
              </button>
            </div>
          </div>
          <div className="flow-canvas">
            <ReactFlowProvider>
              <ReactFlow
                key={`${detail?.id || activeFlow || 'system'}:${detailPath.map(step => step.id).join(':')}`}
                nodes={renderNodes}
                edges={renderEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onInit={instance => {
                  flowInstance.current = instance;
                  window.requestAnimationFrame(() => instance.fitView({ padding: 0.12, maxZoom: 1.05 }));
                }}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                fitViewOptions={{ padding: 0.12, maxZoom: 1.05 }}
                minZoom={0.2}
                maxZoom={1.8}
                nodesDraggable
                nodesConnectable={false}
                onNodeClick={(_, node) => {
                  const component = graph.components.find(item => item.id === node.id);
                  if (component && !detail && !activeFlow) {
                    openComponent(component);
                  }
                }}
                onEdgeClick={(_, selected) => {
                  const edgeId = selected.id
                    .replace(/^detail:/, '')
                    .replace(/:(in|out)$/, '');
                  const edge = graph.edges.find(item => item.id === edgeId);
                  if (edge) {
                    setInspectedEdge(edge);
                    setInspectedComponent(undefined);
                    setInspectorOpen(true);
                  }
                }}
                proOptions={{ hideAttribution: true }}
              >
                <Background color="#c8ccc6" gap={24} size={1} />
                <Controls position="bottom-left" showInteractive={false} />
                <Panel position="bottom-center">
                  <div className="legend">
                    {Object.entries(edgeColors).map(([kind, color]) => (
                      <span key={kind}><i style={{ background: color }} />{copy.edgeKinds[kind as FlowKind]}</span>
                    ))}
                  </div>
                </Panel>
                <Panel position="top-right">
                  <button className="icon-button" type="button" title={copy.fitGraph} onClick={() => flowInstance.current?.fitView({ padding: 0.12, maxZoom: 1.05 })}>
                    <Focus size={18} />
                  </button>
                </Panel>
              </ReactFlow>
            </ReactFlowProvider>
          </div>
        </section>
        {inspectorOpen && (
          <Inspector
            graph={graph}
            component={inspectedComponent || detail || undefined}
            edge={inspectedEdge}
            copy={copy}
            onClose={() => setInspectorOpen(false)}
          />
        )}
      </main>
    </div>
  );
}
