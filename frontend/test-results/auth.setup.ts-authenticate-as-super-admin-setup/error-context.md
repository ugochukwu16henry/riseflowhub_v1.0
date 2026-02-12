# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
      - generic [ref=e15]: Backend not responding. Set NEXT_PUBLIC_API_URL on Vercel to your Render backend URL (e.g. https://riseflowhub-v1-0-1.onrender.com) and FRONTEND_URL on Render to this site’s URL, then redeploy both. If you’re on a paid plan and it still fails, check the Render dashboard that the service is running and the URL is correct.
      - generic [ref=e16]:
        - generic [ref=e17]: Email
        - textbox "Email" [ref=e18]: test-super_admin@example.com
      - generic [ref=e19]:
        - generic [ref=e20]: Password
        - textbox "Password" [ref=e21]: Password123
      - button "Sign in" [ref=e22] [cursor=pointer]
    - paragraph [ref=e23]:
      - text: Don't have an account?
      - link "Register" [ref=e24] [cursor=pointer]:
        - /url: /register
  - alert [ref=e25]
```