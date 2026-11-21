import { h } from "vue";

const SceneNode = {
  name: "SceneNode",
  props: { item: { type: Object, required: true } },
  setup(props) {
    const render = (item) =>
      h(
        item.tag,
        item.attrs,
        item.children ? item.children.map(render) : undefined,
      );
    return () => render(props.item);
  },
};

export default SceneNode;
