export type FlowKind = 'data' | 'control' | 'async' | 'init' | 'dependency';

export interface SourceRef {
  file: string;
  symbol: string;
}

export interface InternalStep {
  id: string;
  label: string;
  summary?: string;
  file?: string;
  symbol?: string;
  tone?: 'entry' | 'process' | 'decision' | 'exit' | 'state';
  children?: InternalStep[];
  internalEdges?: InternalEdge[];
}

export interface InternalEdge {
  source: string;
  target: string;
  label?: string;
  kind?: FlowKind;
}

export interface ComponentFile {
  path: string;
  symbols: Array<{ id: string; references: number }>;
}

export interface GraphComponent {
  id: string;
  label: string;
  summary: string;
  group: string;
  internalSteps: InternalStep[];
  internalEdges: InternalEdge[];
  stats: { files: number; symbols: number; references: number };
  files: ComponentFile[];
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  kind: FlowKind;
  payload: string;
  sourceStep?: string;
  targetStep?: string;
  semantic: boolean;
  evidenceRequired: boolean;
  references: string[];
  static: null | {
    callSites: number;
    totalWeight: number;
    provenance: string[];
    evidence: Array<{ from: SourceRef; to: SourceRef }>;
  };
}

export interface AgentCodeGraph {
  schemaVersion: string;
  source: Record<string, unknown>;
  project: {
    name: string;
    language: string;
    locale?: string;
    description: string;
    sourceRoots: string[];
  };
  groups: Array<{ id: string; label: string; summary?: string }>;
  components: GraphComponent[];
  edges: GraphEdge[];
  flows: Array<{
    id: string;
    label: string;
    summary?: string;
    kind: string;
    steps: Array<{ component: string; step?: string; label?: string }>;
  }>;
  layout: {
    direction?: 'LR' | 'TB';
    groupOrder?: string[];
    componentOrder?: string[];
    edgeOverrides?: Record<string, {
      sourceSide?: Side;
      targetSide?: Side;
    }>;
  };
  diagnostics: {
    unclassifiedFiles?: string[];
    ambiguousFiles?: Array<{ file: string; components: string[] }>;
    semanticCoverage?: { describedEdges: number; staticEdges: number };
  };
}

export type Side = 'left' | 'right' | 'top' | 'bottom';
