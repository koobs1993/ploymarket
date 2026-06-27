import { JoinButton } from "./JoinButton";

export function PredictButton({ className = "" }: { className?: string }) {
  return (
    <JoinButton
      size="lg"
      label="Predict For FREE"
      className={`predict-btn ${className}`.trim()}
    />
  );
}
