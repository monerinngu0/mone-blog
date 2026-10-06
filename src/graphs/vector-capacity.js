export default function setupVectorCapacityGraph(board) {
  const pushes = board.create('slider', [[6, -9], [58, -9], [1, 16, 64]], {
    name: 'push_back の回数',
    snapWidth: 1,
    precision: 0,
    strokeColor: '#667085',
    fillColor: '#39456f',
    highline: { strokeColor: '#39456f' },
  });

  const movedElements = () => {
    const count = Math.round(pushes.Value());
    let capacity = 1;
    let moved = 0;

    while (capacity < count) {
      moved += capacity;
      capacity *= 2;
    }

    return moved;
  };

  board.create('functiongraph', [(x) => x, 0, 64], {
    name: 'n',
    strokeColor: '#98a2b3',
    dash: 2,
    fixed: true,
  });

  board.create('functiongraph', [(x) => 2 * x, 0, 64], {
    name: '2n',
    strokeColor: '#d0d5dd',
    dash: 2,
    fixed: true,
  });

  board.create('point', [() => pushes.Value(), movedElements], {
    name: '',
    size: 5,
    strokeColor: '#39456f',
    fillColor: '#39456f',
    fixed: true,
  });

  board.create('segment', [[() => pushes.Value(), 0], [() => pushes.Value(), movedElements]], {
    strokeColor: '#39456f',
    dash: 1,
    fixed: true,
  });

  board.create('text', [3, 120, () => `移動した要素の合計: ${movedElements()}`], {
    fontSize: 16,
    color: '#1d2433',
    fixed: true,
  });
}
