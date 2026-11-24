
export function DemoInvitation() {
  return (
    <section
      id="request-access"
      style={{
        background: "#102b4e",
        padding: "60px 8%",
        color: "white",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ maxWidth: "650px", margin: "auto" }}>
        <h2 style={{ fontSize: "36px", fontWeight: 600 }}>
          Get Started with CardioLink
        </h2>

        <p style={{ marginTop: "12px", lineHeight: 1.5 }}>
          Interested in CardioLink? Request free
          access. Our team will review your request
          and contact you about getting started.
        </p>

        <form
          action="https://formspree.io/f/xnpdolyg"
          method="POST"
          style={{
            display: "grid",
            gap: "16px",
            marginTop: "25px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          <label style={labelStyle}>
            Full name
            <input name="name" type="text" required
              placeholder="Enter your name" style={fieldStyle} />
          </label>

          <label style={labelStyle}>
            Email address
            <input name="email" type="email" required
              placeholder="Enter your email" style={fieldStyle} />
          </label>

          <label style={labelStyle}>
            Account type
            <select name="account_type" required style={fieldStyle}>
              <option value="">Choose one</option>
              <option value="Patient">Patient</option>
              <option value="Care team">Care team</option>
            </select>
          </label>

          <button type="submit" style={{
            padding: "15px",
            background: "white",
            color: "#0b2545",
            border: "none",
            borderRadius: "8px",
            fontWeight: 600,
            fontFamily: "Inter, sans-serif",
            fontSize: "15px",
            cursor: "pointer",
          }}>
            Submit Sign-Up Request →
          </button>

          <p style={{ fontSize: "13px", lineHeight: 1.5 }}>
            Our team will review your request and
            contact you about account access.
            Submitting does not automatically
            create an account.
          </p>
        </form>
      </div>
    </section>
  );
}

const labelStyle = {
  display: "grid",
  gap: "8px",
  fontFamily: "Inter, sans-serif",
  fontSize: "15px",
  fontWeight: 500,
};

const fieldStyle = {
  display: "block",
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "13px",
  border: "1px solid #d5dce5",
  borderRadius: "7px",
  background: "white",
  color: "#0b2545",
  fontSize: "15px",
  fontFamily: "Inter, sans-serif",
};
