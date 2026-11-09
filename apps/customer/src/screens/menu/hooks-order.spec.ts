/**
 * Regression guard for F1: "Opening the item sheet crashes the app".
 *
 * ItemDetailSheet called `useRef` AFTER `if (!item) return null`. The sheet is
 * mounted with item={null}, so the first real open changed the number of hooks
 * between renders and React threw ("Rendered more hooks than during the
 * previous render"). With no error boundary the whole app went blank.
 *
 * The proper tool for this is ESLint's react-hooks/rules-of-hooks (planned in
 * M0, needs a lockfile update). Until that is installed, this test enforces the
 * same rule on the menu screens using only the `typescript` package that is
 * already a devDependency, so it adds nothing to package.json or the lockfile.
 */
import { describe, it, expect } from 'vitest';
import ts from 'typescript';
import itemDetailSheetSrc from '../ItemDetailSheet.tsx?raw';
import menuScreenSrc from '../MenuScreen.tsx?raw';
import orderDetailScreenSrc from '../OrderDetailScreen.tsx?raw';
import appNavSrc from '../../components/AppNav.tsx?raw';
import topNavSrc from '../../components/TopNav.tsx?raw';
import cartPanelSrc from '../../components/CartPanel.tsx?raw';
import freeDeliveryStripSrc from '../../components/FreeDeliveryStrip.tsx?raw';
import focusModeSrc from './FocusMode.tsx?raw';
import menuRowSrc from './MenuRow.tsx?raw';
import catBlockSrc from './CatBlock.tsx?raw';
import menuStatesSrc from './MenuStates.tsx?raw';
import addButtonSrc from './AddButton.tsx?raw';

interface HookViolation {
  component: string;
  hook: string;
  line: number;
}

const HOOK_NAME = /^use[A-Z0-9]/;

/** Every call expression under `node`, without descending into nested functions. */
function callsIn(node: ts.Node, out: ts.CallExpression[] = []): ts.CallExpression[] {
  if (ts.isCallExpression(node)) out.push(node);
  ts.forEachChild(node, child => {
    if (ts.isFunctionLike(child)) return;   // callbacks are a different scope
    callsIn(child, out);
  });
  return out;
}

/** True if `node` contains a `return` that belongs to the same function. */
function containsReturn(node: ts.Node): boolean {
  if (ts.isReturnStatement(node)) return true;
  let found = false;
  ts.forEachChild(node, child => {
    if (found || ts.isFunctionLike(child)) return;
    found = containsReturn(child);
  });
  return found;
}

function hookName(call: ts.CallExpression): string | null {
  const e = call.expression;
  if (ts.isIdentifier(e) && HOOK_NAME.test(e.text)) return e.text;
  if (ts.isPropertyAccessExpression(e) && HOOK_NAME.test(e.name.text)) return e.name.text;
  return null;
}

/** Find hook calls that come after a conditional/early return in a component. */
function findHooksAfterEarlyReturn(source: string): HookViolation[] {
  const sf = ts.createSourceFile('component.tsx', source, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TSX);
  const violations: HookViolation[] = [];

  const checkBody = (name: string, body: ts.Block) => {
    let earlyReturnSeen = false;
    for (const stmt of body.statements) {
      if (earlyReturnSeen) {
        for (const call of callsIn(stmt)) {
          const hook = hookName(call);
          if (hook) {
            const { line } = sf.getLineAndCharacterOfPosition(call.getStart());
            violations.push({ component: name, hook, line: line + 1 });
          }
        }
      }
      // Any return that is not the function's final statement is an early return.
      if (stmt !== body.statements[body.statements.length - 1] && containsReturn(stmt)) {
        earlyReturnSeen = true;
      }
    }
  };

  const visit = (node: ts.Node) => {
    if (ts.isFunctionDeclaration(node) && node.name && /^[A-Z]/.test(node.name.text) && node.body) {
      checkBody(node.name.text, node.body);
    } else if (
      ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && /^[A-Z]/.test(node.name.text) &&
      node.initializer && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer)) &&
      ts.isBlock(node.initializer.body)
    ) {
      checkBody(node.name.text, node.initializer.body);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return violations;
}

// ─────────────────────────────────────────────────────────────────────────────

describe('findHooksAfterEarlyReturn (the checker itself)', () => {
  it('flags the exact shape of F1: a hook below `if (!item) return null`', () => {
    const bad = `
      export function Sheet({ item }) {
        const [a] = useState(1);
        if (!item) return null;
        const ref = useRef(0);
        return null;
      }`;
    const found = findHooksAfterEarlyReturn(bad);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ component: 'Sheet', hook: 'useRef' });
  });

  it('accepts hooks that all run before the early return', () => {
    const good = `
      export function Sheet({ item }) {
        const [a] = useState(1);
        const ref = useRef(0);
        if (!item) return null;
        const label = item.name;
        return null;
      }`;
    expect(findHooksAfterEarlyReturn(good)).toEqual([]);
  });

  it('flags arrow-function components and React.useX calls too', () => {
    const bad = `
      const Panel = ({ open }) => {
        if (!open) { return null; }
        const m = React.useMemo(() => 1, []);
        return null;
      };`;
    expect(findHooksAfterEarlyReturn(bad).map(v => v.hook)).toEqual(['useMemo']);
  });

  it('does not treat a return inside a nested callback as an early return', () => {
    const fine = `
      function List({ rows }) {
        const out = rows.map(r => { if (!r) return null; return r; });
        const ref = useRef(0);
        return out;
      }`;
    expect(findHooksAfterEarlyReturn(fine)).toEqual([]);
  });
});

describe('screens follow the rules of hooks', () => {
  it('ItemDetailSheet declares every hook before `if (!item) return null`', () => {
    expect(findHooksAfterEarlyReturn(itemDetailSheetSrc)).toEqual([]);
  });

  it('MenuScreen declares every hook before its loading/empty/error returns', () => {
    expect(findHooksAfterEarlyReturn(menuScreenSrc)).toEqual([]);
  });

  it('OrderDetailScreen declares every hook before its loading/not-found returns (F15)', () => {
    expect(findHooksAfterEarlyReturn(orderDetailScreenSrc)).toEqual([]);
  });
});

describe('the new menu components follow the rules of hooks', () => {
  it.each([
    { name: 'AppNav',            src: appNavSrc },
    { name: 'TopNav',            src: topNavSrc },
    { name: 'CartPanel',         src: cartPanelSrc },
    { name: 'FreeDeliveryStrip', src: freeDeliveryStripSrc },
    { name: 'FocusMode',         src: focusModeSrc },
    { name: 'MenuRow',           src: menuRowSrc },
    { name: 'CatBlock',          src: catBlockSrc },
    { name: 'MenuStates',        src: menuStatesSrc },
    { name: 'AddButton',         src: addButtonSrc },
  ])('$name declares every hook before any early return', ({ src }) => {
    expect(findHooksAfterEarlyReturn(src)).toEqual([]);
  });
});
