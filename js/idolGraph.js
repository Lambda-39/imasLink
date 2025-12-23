/**
 * ブランドカラー定義
 * お嬢様が調整された名称に準拠しておりますわ
 */
const BRAND_COLORS = {
    '765PRO AS': '#f34f6d',
    'Cinderella Girls': '#2681c8',
    'Million Live': '#ffc30b',
    'SideM': '#0dba3b',
    'Shiny Colors': '#79c5f0',
    'Gakuen': '#ff8c00',
    'Other': '#ccc'
};

// 劇場の「現在の選考（フィルター）」を記憶する日記帳ですわ
let currentFilter = "All";

/**
 * 物理演算（fCoSE）の設定
 * 島同士の「独立性」を極限まで高めた、広大な舞台設計ですわ
 */
const getFCoSEOptions = (isFilter = false) => ({
    name: 'fcose',
    quality: 'default',
    randomize: !isFilter,
    animate: true,
    animationDuration: 1500,
    fit: true,
    padding: 100, // 少し余裕を持たせますわ

    // --- 演出：島の分離を強化する四柱の魔法 ---

    // 1. ノード同士の反発力を大幅に強化（150,000 → 450,000）
    // これで密集地帯に風が通り、お顔が重なりにくくなりますわ
    nodeRepulsion: 450000,

    // 2. 中心へ引き寄せる重力を極限まで弱めます（0.05 → 0.01）
    // 島同士が中央に集まろうとするのを防ぎ、外側へ広がるのを許容いたします
    gravity: 0.01,

    // 3. 独立した「島」同士の隙間を大幅に拡大（120 → 300）
    // 関係性のないグループ同士に、優雅な「中庭」を作りますわ
    tile: true,
    tilingPaddingVertical: 300,
    tilingPaddingHorizontal: 300,

    // 4. 絆の長さのメリハリ
    // 相互フォロー（mutual）は短く、片思い（通常）は少し長めに保ちますわ
    idealEdgeLength: (edge) => edge.hasClass('mutual') ? 100 : 350,

    // ------------------------------------------

    numIter: 5000,
    uniformNodeDimensions: false,
    packComponents: true, // 島を独立してパッキングいたしますわ
});

/**
 * 劇場の開演（初期化）
 */
window.initIdolGraph = (data) => {
    if (window.cyInstance) { window.cyInstance.destroy(); }

    const cyContainer = document.getElementById('cy');
    // 演出：右クリックメニューを封印し、独自の操作を許可いたします
    cyContainer.oncontextmenu = () => false;

    window.cyInstance = cytoscape({
        container: cyContainer,
        elements: data,

        // --- 操作感の調律 ---
        wheelSensitivity: 0.4,      // ズーム速度を向上させましたわ
        boxSelectionEnabled: false, // 右ドラッグを移動に使うため解除いたします
        userPanningEnabled: true,   // 平行移動を許可いたします

        style: [
            // --- アイドル（ノード）の正装 ---
            {
                selector: 'node',
                style: {
                    'width': 'data(baseSize)',
                    'height': 'data(baseSize)',
                    'background-image': 'data(image)',
                    'background-fit': 'cover',
                    'label': 'data(name)',
                    'font-size': '12px', 'text-valign': 'bottom', 'text-margin-y': '8px',
                    'border-width': 6,
                    'border-style': 'solid',
                    'border-color': (node) => BRAND_COLORS[node.data('brand')] || BRAND_COLORS['Other'],
                    'transition-property': 'width, height, border-width, opacity',
                    'transition-duration': '0.3s'
                }
            },
            {
                selector: 'node.highlight',
                style: {
                    'width': (node) => node.data('baseSize') * 1.15,
                    'height': (node) => node.data('baseSize') * 1.15,
                    'border-width': 12,
                    'z-index': 999
                }
            },
            // --- 絆（エッジ）の正装 ---
            {
                selector: 'edge',
                style: {
                    'width': 3,
                    'arrow-scale': 1.8,      // 巨大な三角形の誇りですわ
                    'line-color': '#666',
                    'target-arrow-shape': 'triangle',
                    'target-arrow-color': '#666',
                    'curve-style': 'bezier',
                    'opacity': 0.8,
                    'transition-property': 'width, opacity, line-color',
                    'transition-duration': '0.3s'
                }
            },
            {
                selector: 'edge.mutual',
                style: {
                    'width': 8,
                    'line-color': '#FF69B4',
                    'target-arrow-color': '#FF69B4',
                    'source-arrow-shape': 'triangle', // 両端の三角形ですわ
                    'source-arrow-color': '#FF69B4',
                    'opacity': 0.9
                }
            },
            {
                selector: 'edge.focus',
                style: { 'opacity': 1, 'width': 5 }
            },
            {
                selector: 'edge.focus.mutual',
                style: { 'width': 12 }
            },
            { selector: '.faded', style: { 'opacity': 0.05, 'events': 'no' } }
        ],
        ready: function () {
            const cy = this;
            const nodes = cy.nodes();

            // 面積比例の黄金比計算（最大は最小の3倍に収めますわ）
            const minSize = 80;
            const maxSize = minSize * 3;
            const maxInDegree = Math.max(...nodes.map(n => n.indegree()), 1);
            const scaleFactor = (maxSize - minSize) / Math.sqrt(maxInDegree);

            nodes.forEach(node => {
                const bSize = minSize + (Math.sqrt(node.indegree()) * scaleFactor);
                node.data('baseSize', bSize);
                node.style({ 'width': bSize, 'height': bSize });
            });

            cy.layout(getFCoSEOptions(false)).run();

            // --- 右クリックドラッグによる平行移動の魔法 ---
            cy.on('cxtdrag', (e) => {
                cy.panBy({ x: e.originalEvent.movementX, y: e.originalEvent.movementY });
            });

            // マウス操作
            cy.on('mouseover', 'node', (e) => highlightIdol(e.target));
            cy.on('mouseout', 'node', () => clearHighlight());
        }
    });

    // 背景タップで全体を収めますわ
    window.cyInstance.on('tap', function (event) {
        if (event.target === window.cyInstance) {
            window.cyInstance.animate({ fit: { padding: 70 }, duration: 800 });
        }
    });

    window.cyInstance.on('tap', 'node', (evt) => {
        window.open('https://idollist.idolmaster-official.jp/search/detail/' + evt.target.id(), '_blank');
    });

    // リサイズ追従
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.cyInstance) {
                window.cyInstance.resize();
                window.cyInstance.fit(null, 70);
            }
        }, 200);
    });
};

/**
 * 演出補助：ハイライトと解除
 */
function highlightIdol(node) {
    if (!window.cyInstance) return;
    const cy = window.cyInstance;
    const neighborhood = node.closedNeighborhood();
    cy.elements().removeClass('faded highlight focus');
    cy.elements().not(neighborhood).addClass('faded');
    node.addClass('highlight');
    neighborhood.edges().addClass('focus');
}

function clearHighlight() {
    if (!window.cyInstance) return;
    window.cyInstance.elements().removeClass('faded highlight focus');
}

/**
 * 演出補助：指名手配（検索）
 */
window.searchAndHighlight = (name) => {
    if (!window.cyInstance) return;
    const cy = window.cyInstance;
    if (!name || name.trim() === "") {
        clearHighlight();
        return;
    }
    const target = cy.nodes().filter(n => n.data('name').includes(name)).first();
    if (target.length > 0) {
        highlightIdol(target);
        cy.animate({ center: { eles: target }, zoom: 1.2 }, { duration: 500 });
    }
};

/**
 * 演出補助：選考（フィルター）
 */
window.applyBrandFilter = (brand) => {
    currentFilter = brand; // ここで選考内容を記憶いたします
    const cy = window.cyInstance;
    if (!cy) return;

    cy.elements().show();
    if (brand === "MutualOnly") {
        cy.elements().hide();
        const mutualEdges = cy.edges('.mutual');
        mutualEdges.show();
        mutualEdges.connectedNodes().show();
    } else if (brand !== "All") {
        cy.elements().hide();
        const nodes = cy.nodes(`[brand = "${brand}"]`);
        nodes.show();
        nodes.connectedEdges().show();
    }

    // フィルター時は位置を変えない（randomize: false）ようにいたしますわ
    cy.elements(':visible').layout(getFCoSEOptions(true)).run();
};

/**
* 演出補助：再ランダム配置
*/
window.rerunLayout = () => {
    const cy = window.cyInstance;
    if (!cy) return;


    // 【ここが重要ですわ！】
    // 全員ではなく、現在見えている（フィルターを通り抜けた）アイドルたちだけを
    // 新たな運命（randomize: true）に導きますわ
    cy.elements(':visible').layout(getFCoSEOptions(false)).run();
};