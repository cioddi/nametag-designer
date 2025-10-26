import React from "react";

function Icon(props) {
  console.log('SVG PROPS')
  console.log(props)
  return (
    <svg
      className="MuiSvgIcon-root"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      version="1.1"
      viewBox="0 0 135.467 135.467"
      {...props}
    >
      <g transform="translate(-35.832 -72.029)">
        <path
          d="M83.833 163.516h-7.877v-23.675H59.418v23.675H51.54v-46.567q0-3.96 3.394-6.615 3.22-2.568 7.225-2.568h11.315q3.917 0 7.05 2.568 3.308 2.742 3.308 6.615zm-7.877-30.377v-14.754q0-1.566-.914-2.654-.87-1.088-2.525-1.088h-9.835q-1.698 0-2.48 1.088-.784 1.088-.784 2.654v14.754z"
        ></path>
        <path
          d="M119.171 128.395q0 4.657-3.22 6.18 4.526 1.306 4.526 7.616v11.881q0 3.917-2.133 6.572-2.306 2.872-6.136 2.872H88.272v-55.62h7.92v.044h14.71q3.917 0 6.18 3.003 2.09 2.699 2.09 6.746zm-7.746-10.27q0-3.265-3.743-3.265h-11.49v16.712h12.447q1.35 0 2.046-1.045.74-1.044.74-2.306zm-2.002 38.776q3.307 0 3.307-3.438v-11.707q0-3.264-3.743-3.264H96.194V156.9z"
        ></path>
        <path
          d="M147.068 118.864q0-4.221-3.438-4.221h-7.66q-1.697 0-2.48 1.088-.784 1.088-.784 2.654v34.599q0 1.567.783 2.655.784 1.088 2.481 1.088h7.66q3.35 0 3.438-3.874v-2.001h7.877v3.568q0 3.917-2.829 6.528-2.829 2.568-6.658 2.568h-10.01q-4.047 0-7.224-2.524-3.395-2.655-3.395-6.572v-37.47q0-3.961 3.395-6.616 3.22-2.568 7.224-2.568h10.01q3.873 0 6.658 2.655 2.83 2.655 2.83 6.528v4.004h-7.878z"
        ></path>
        <path
          d="M53.107 163.258a4 4 0 100 8h100.688a4 4 0 100-8z"
          style={{
            lineHeight: "normal",
            fontVariantLigatures: "normal",
            fontVariantPosition: "normal",
            fontVariantCaps: "normal",
            fontVariantNumeric: "normal",
            fontVariantAlternates: "normal",
            fontFeatureSettings: "normal",
            WebkitTextIndent: "0",
            textIndent: "0",
            WebkitTextAlign: "start",
            textAlign: "start",
            WebkitTextDecorationLine: "none",
            textDecorationLine: "none",
            WebkitTextDecorationStyle: "solid",
            textDecorationStyle: "solid",
            WebkitTextDecorationColor: "#000000",
            textDecorationColor: "#000000",
            WebkitTextTransform: "none",
            textTransform: "none",
            WebkitTextOrientation: "mixed",
            textOrientation: "mixed",
            whiteSpace: "normal",
            shapePadding: "0",
            isolation: "auto",
            mixBlendMode: "normal",
            solidOpacity: "1"
          }}
          strokeDashoffset="0"
          strokeLinecap="round"
          strokeLinejoin="miter"
          strokeMiterlimit="4"
          strokeOpacity="1"
          strokeWidth="8"
          shapeRendering="auto"
        ></path>
      </g>
    </svg>
  );
}

export default Icon;
