"use client";

export function ConsentCheckbox({
  name = "consent",
  required = true,
}: {
  name?: string;
  required?: boolean;
}) {
  return (
    <div className="consent-field">
      <label className="consent-row">
        <input
          type="checkbox"
          className="site-checkbox"
          name={name}
          value="true"
          required={required}
        />
        <span>
          Я даю согласие на обработку персональных данных в соответствии с{" "}
          <a href="/privacy" target="_blank" rel="noreferrer">
            политикой
          </a>{" "}
          и{" "}
          <a href="/policy/agreement" target="_blank" rel="noreferrer">
            формой согласия
          </a>
          .
        </span>
      </label>
    </div>
  );
}
