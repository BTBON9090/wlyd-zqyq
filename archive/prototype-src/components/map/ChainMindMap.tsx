import { useMemo, useState } from "react";
import {
  chainMindTree,
  getEnterpriseById,
  type ChainMindNode,
  type MapEnterprise,
} from "../../data/industryMap";

type Props = {
  onSelectEnterprise: (ent: MapEnterprise) => void;
  onShowOnMap: (ent: MapEnterprise) => void;
};

function NodeBlock({
  node,
  depth,
  expanded,
  toggle,
  onSelectEnterprise,
  onShowOnMap,
}: {
  node: ChainMindNode;
  depth: number;
  expanded: Set<string>;
  toggle: (id: string) => void;
  onSelectEnterprise: (ent: MapEnterprise) => void;
  onShowOnMap: (ent: MapEnterprise) => void;
}) {
  const open = expanded.has(node.id);
  const ents = node.enterpriseIds
    .map((id) => getEnterpriseById(id))
    .filter(Boolean) as MapEnterprise[];
  const hasChildren = Boolean(node.children?.length);

  return (
    <div className={`chain-mind-node kind-${node.kind}`} style={{ marginLeft: depth * 12 }}>
      <button type="button" className="chain-mind-head" onClick={() => toggle(node.id)}>
        <span className={`chain-mind-caret ${open ? "open" : ""}`}>{hasChildren || ents.length ? "▸" : "·"}</span>
        <b>{node.label}</b>
        <em>{ents.length ? `${ents.length} 家企业` : hasChildren ? `${node.children!.length} 节点` : ""}</em>
      </button>
      {open && (
        <div className="chain-mind-body">
          {ents.length > 0 && (
            <ul className="chain-mind-ents">
              {ents.map((e) => (
                <li key={e.id}>
                  <button type="button" className="chain-mind-ent" onClick={() => onSelectEnterprise(e)}>
                    <b>{e.name}</b>
                    <span>{e.industryL2}</span>
                  </button>
                  <button type="button" className="chain-mind-mapbtn" onClick={() => onShowOnMap(e)}>
                    地图
                  </button>
                </li>
              ))}
            </ul>
          )}
          {node.children?.map((child) => (
            <NodeBlock
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              toggle={toggle}
              onSelectEnterprise={onSelectEnterprise}
              onShowOnMap={onShowOnMap}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ChainMindMap({ onSelectEnterprise, onShowOnMap }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(["root-equip", "up-parts", "mid-asm", "down-app"]),
  );

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const lanes = useMemo(() => chainMindTree.children ?? [], []);

  return (
    <div className="chain-mind">
      <div className="chain-mind-root">
        <strong>{chainMindTree.label}</strong>
        <span>上游 → 中游 → 下游 · 点击展开穿透</span>
      </div>
      <div className="chain-mind-lanes">
        {lanes.map((lane) => (
          <div key={lane.id} className={`chain-mind-lane kind-${lane.kind}`}>
            <NodeBlock
              node={lane}
              depth={0}
              expanded={expanded}
              toggle={toggle}
              onSelectEnterprise={onSelectEnterprise}
              onShowOnMap={onShowOnMap}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
