import React, { useState } from "react";

function Progress({ status }: { status: string }) {
  const [steps, setStep] = useState({
    stpesCount: [1, 2, 3],
    currentStep: getStep(status),
  });
  const labels = ["Received", "ACCEPTED_ON_L1", "ACCEPTED_ON_L2"];

  function getStep(status: string): number {
    const statusToStep: { [key: string]: number } = {
      Received: 1,
      ACCEPTED_ON_L1: 2,
      ACCEPTED_ON_L2: 3,
    };

    return statusToStep[status] !== undefined ? statusToStep[status] : 1;
  }

  return (
    <div className="max-w-lg px-4 sm:px-0 my-2">
      <ul aria-label="Steps" className="flex items-center">
        {steps.stpesCount.map((item, idx) => (
          <li
            key={idx}
            aria-current={steps.currentStep == idx + 1 ? "step" : false}
            className="flex-1 last:flex-none flex items-center"
          >
            <div
              className={`rounded-full border-2 flex-none flex items-center justify-center ${
                steps.currentStep > idx
                  ? "bg-green-600 border-green-600"
                  : "" || steps.currentStep == idx + 1
                  ? "border-green-600"
                  : ""
              }`}
            >
              {steps.currentStep > idx ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-white"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              ) : (
                ""
              )}
              <span className="text-xs font-bold text-center text-white p-2">
                {labels[idx]}
              </span>
            </div>
            <hr
              className={`w-full border ${
                idx + 1 == steps.stpesCount.length
                  ? "hidden"
                  : "" || steps.currentStep > idx + 1
                  ? "border-green-600"
                  : ""
              }`}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Progress;
