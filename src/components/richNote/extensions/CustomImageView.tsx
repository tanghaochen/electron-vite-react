import React, { useCallback, useEffect, useMemo, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import { clamp, isNumber, throttle } from "lodash-es";

// 常量定义
const IMAGE_MAX_SIZE = 1024;
const IMAGE_MIN_SIZE = 100;
const IMAGE_THROTTLE_WAIT_TIME = 100;

function ImageView(props) {
  const [maxSize, setMaxSize] = useState({
    width: IMAGE_MAX_SIZE,
    height: IMAGE_MAX_SIZE,
  });

  const [originalSize, setOriginalSize] = useState({
    width: 0,
    height: 0,
  });

  const ResizeDirection = {
    TOP_LEFT: "tl",
    TOP_RIGHT: "tr",
    BOTTOM_LEFT: "bl",
    BOTTOM_RIGHT: "br",
  };

  const [resizeDirections] = useState([
    ResizeDirection.TOP_LEFT,
    ResizeDirection.TOP_RIGHT,
    ResizeDirection.BOTTOM_LEFT,
    ResizeDirection.BOTTOM_RIGHT,
  ]);

  const [resizing, setResizing] = useState(false);

  const [resizerState, setResizerState] = useState({
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    dir: "",
  });

  const { align, inline } = props?.node?.attrs;

  const imgAttrs = useMemo(() => {
    const { src, alt, width: w, height: h } = props?.node?.attrs;

    const width = isNumber(w) ? `${w}px` : w;
    const height = isNumber(h) ? `${h}px` : h;

    return {
      src: src || undefined,
      alt: alt || undefined,
      style: {
        width: width || undefined,
        height: height || undefined,
      },
    };
  }, [props?.node?.attrs]);

  const imageMaxStyle = useMemo(() => {
    const {
      style: { width },
    } = imgAttrs;

    return { width: width === "100%" ? width : undefined };
  }, [imgAttrs]);

  function onImageLoad(e) {
    setOriginalSize({
      width: e.target.width,
      height: e.target.height,
    });
  }

  function selectImage() {
    const { editor, getPos } = props;
    editor.commands.setNodeSelection(getPos());
  }

  const getMaxSize = useCallback(
    throttle(() => {
      const { editor } = props;
      const { width } = getComputedStyle(editor.view.dom);
      setMaxSize((prev) => {
        return {
          ...prev,
          width: Number.parseInt(width, 10),
        };
      });
    }, IMAGE_THROTTLE_WAIT_TIME),
    [props?.editor],
  );

  function onMouseDown(e, dir) {
    e.preventDefault();
    e.stopPropagation();

    const originalWidth = originalSize.width;
    const originalHeight = originalSize.height;
    const aspectRatio = originalWidth / originalHeight;

    let width = Number(props.node.attrs.width);
    let height = Number(props.node.attrs.height);
    const maxWidth = maxSize.width;

    if (width && !height) {
      width = width > maxWidth ? maxWidth : width;
      height = Math.round(width / aspectRatio);
    } else if (height && !width) {
      width = Math.round(height * aspectRatio);
      width = width > maxWidth ? maxWidth : width;
    } else if (!width && !height) {
      width = originalWidth > maxWidth ? maxWidth : originalWidth;
      height = Math.round(width / aspectRatio);
    } else {
      width = width > maxWidth ? maxWidth : width;
    }

    setResizing(true);

    setResizerState({
      x: e.clientX,
      y: e.clientY,
      w: width,
      h: height,
      dir,
    });
  }

  const onMouseMove = useCallback(
    throttle((e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!resizing) {
        return;
      }

      const { x, w, dir } = resizerState;

      const dx = (e.clientX - x) * (/l/.test(dir) ? -1 : 1);

      const width = clamp(w + dx, IMAGE_MIN_SIZE, maxSize.width);
      const height = null;

      props.updateAttributes({
        width,
        height,
      });
    }, IMAGE_THROTTLE_WAIT_TIME),
    [resizing, resizerState, maxSize],
  );

  const onMouseUp = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!resizing) {
        return;
      }

      setResizerState({
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        dir: "",
      });
      setResizing(false);

      selectImage();
    },
    [resizing],
  );

  const onEvents = useCallback(() => {
    document?.addEventListener("mousemove", onMouseMove, true);
    document?.addEventListener("mouseup", onMouseUp, true);
  }, [onMouseMove, onMouseUp]);

  const offEvents = useCallback(() => {
    document?.removeEventListener("mousemove", onMouseMove, true);
    document?.removeEventListener("mouseup", onMouseUp, true);
  }, [onMouseMove, onMouseUp]);

  useEffect(() => {
    if (resizing) {
      onEvents();
    } else {
      offEvents();
    }

    return () => {
      offEvents();
    };
  }, [resizing, onEvents, offEvents]);

  const resizeOb = useMemo(() => {
    return new ResizeObserver(() => getMaxSize());
  }, [getMaxSize]);

  useEffect(() => {
    if (props.editor && props.editor.view && props.editor.view.dom) {
      resizeOb.observe(props.editor.view.dom);

      return () => {
        resizeOb.disconnect();
      };
    }
  }, [props.editor, resizeOb]);

  return (
    <NodeViewWrapper
      as={inline ? "span" : "div"}
      className="image-view"
      style={{
        ...imageMaxStyle,
        textAlign: align,
        display: inline ? "inline" : "block",
      }}
    >
      <div
        data-drag-handle
        draggable="true"
        style={imageMaxStyle}
        className={`image-view__body ${
          props?.selected ? "image-view__body--focused" : ""
        } ${resizing ? "image-view__body--resizing" : ""}`}
      >
        <img
          alt={imgAttrs.alt || "图片"}
          className="image-view__body__image"
          height="auto"
          onClick={selectImage}
          onLoad={onImageLoad}
          src={imgAttrs.src}
          style={{
            ...imgAttrs.style,
            maxWidth: "100%",
            display: "block",
          }}
        />

        {props?.editor?.isEditable && (props?.selected || resizing) && (
          <div className="image-resizer">
            {resizeDirections?.map((direction) => {
              return (
                <span
                  className={`image-resizer__handler image-resizer__handler--${direction}`}
                  key={`image-dir-${direction}`}
                  onMouseDown={(e) => onMouseDown(e, direction)}
                ></span>
              );
            })}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

export default ImageView;
