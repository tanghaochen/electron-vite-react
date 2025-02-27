export class treeList {
    /**
     * @param treeData: 树形数据结构
     * @param newNode: 新节点
     * @param position: 包含插入位置的对象，包含节点的 id 和插入位置 location（可选值: 'before', 'after', 'child'）
     */
    static insertNode(treeData, newNode, position) {
        const {id, location} = position;

        function traverseAndInsert(nodes) {
            return nodes.map(node => {
                if (node.id === id) {
                    const newNodeCopy = {...node};

                    switch (location) {
                        case 'before':
                            return [newNode, newNodeCopy];  // 在当前节点之前插入新节点
                        case 'after':
                            return [newNodeCopy, newNode];  // 在当前节点之后插入新节点
                        case 'child':
                            if (!newNodeCopy.children) newNodeCopy.children = [];
                            newNodeCopy.children.push(newNode);  // 将新节点作为子节点插入
                            return newNodeCopy;
                        default:
                            return newNodeCopy;
                    }
                } else if (node.children && node.children.length > 0) {
                    const updatedChildren = traverseAndInsert(node.children);  // 递归更新子节点
                    return {
                        ...node,
                        children: updatedChildren
                    };
                }

                return node;
            }).flat();  // 使用 flat 展开数组
        }

        // 返回更新后的树形数据结构
        return traverseAndInsert(treeData);
    }

    // 从树形数据结构中查找节点
    static findById(treeData, id) {
        function traverseAndFind(nodes) {
            for (let node of nodes) {
                if (node.id === id) {
                    return node;
                } else if (node.children && node.children.length > 0) {
                    const result = traverseAndFind(node.children);
                    if (result) return result;
                }
            }
            return null;
        }

        if (!treeData?.length) return {};
        return traverseAndFind(treeData);
    }

    // 根据 id 删除树形数据结构中的节点
    static removeById(treeData, nodeId) {
        function traverseAndDelete(nodes) {
            return nodes.reduce((acc, node) => {
                if (node.id === nodeId) {
                    return acc;
                }

                if (node.children && node.children.length > 0) {
                    node.children = traverseAndDelete(node.children);
                }

                acc.push(node);
                return acc;
            }, []);
        }

        return traverseAndDelete(treeData);
    }

    // 根据 id 更新树形数据结构中的节点
    static updateById(treeData, id, newData, idKey = 'id') {
        function traverseAndUpdate(nodes) {
            return nodes.map(node => {
                if (node[idKey] === id) {
                    return {
                        ...node,
                        ...newData
                    };
                } else if (node.children && node.children.length > 0) {
                    return {
                        ...node,
                        children: traverseAndUpdate(node.children)
                    };
                }
                return node;
            });
        }

        return traverseAndUpdate(treeData);
    }
}

// // 示例数据
// let mainData = [
//     {
//         id: 'pj-2Tx8sBoqFpVgOvlYNQOp2',
//         name: '未命名',
//         children: [],
//         isEdit: false
//     }
// ];
//
// // 要插入的新节点
// let newNode = {
//     id: 'newNodeId',
//     name: '新节点',
//     children: [],
//     isEdit: false
// };
//
// // 插入位置参数
// let position = {
//     id: 'pj-2Tx8sBoqFpVgOvlYNQOp2',
//     location: 'child' // 可选值: 'before', 'after', 'child'
// };
//
// // 插入新节点
// mainData = treeList.insertNode(mainData, newNode, position);
//
// console.log(JSON.stringify(mainData, null, 2));
