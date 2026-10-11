"use client";

import dynamic from "next/dynamic";

// Both presentations use the same inputs, core calculation, prefill and lead payload.
export default dynamic(() => import("./t15.island"));
