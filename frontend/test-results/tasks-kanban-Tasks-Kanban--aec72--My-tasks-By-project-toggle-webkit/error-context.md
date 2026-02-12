# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - img "RiseFlow Hub" [ref=e5]
    - heading "RiseFlow Hub" [level=1] [ref=e6]
    - paragraph [ref=e7]: Sign in to your account
    - generic [ref=e8]:
      - generic [ref=e9]:
        - paragraph [ref=e10]: API unreachable (404 or 502).
        - paragraph [ref=e11]:
          - text: Set
          - strong [ref=e12]: NEXT_PUBLIC_API_URL
          - text: on Vercel to your Render backend URL (e.g.
          - code [ref=e13]: https://riseflowhub-v1-0-1.onrender.com
          - text: ). Set
          - strong [ref=e14]: FRONTEND_URL
          - text: "on Render to this site’s URL. Redeploy both (Vercel: clear cache if needed). If the backend is paid and still unreachable, check the Render dashboard that the service is running."
      - generic [ref=e15]:
        - generic [ref=e16]: Email
        - textbox "Email" [active] [ref=e17]
      - generic [ref=e18]:
        - generic [ref=e19]: Password
        - textbox "Password" [ref=e20]: Password123
      - button "Sign in" [ref=e21] [cursor=pointer]
    - paragraph [ref=e22]:
      - text: Don't have an account?
      - link "Register" [ref=e23]:
        - /url: /register
  - alert [ref=e24]
```