# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - img "RiseFlow Hub" [ref=e5]
    - heading "RiseFlow Hub" [level=1] [ref=e6]
    - paragraph [ref=e7]: Create your account
    - generic [ref=e8]:
      - generic [ref=e9]: Backend not responding. Set NEXT_PUBLIC_API_URL on Vercel and ensure the backend is running.
      - generic [ref=e10]:
        - generic [ref=e11]: Full name
        - textbox "Full name" [ref=e12]: E2E Test User
      - generic [ref=e13]:
        - generic [ref=e14]: Email
        - textbox "Email" [ref=e15]: e2e-1770855689663@example.com
      - generic [ref=e16]:
        - generic [ref=e17]: Password (min 6 characters)
        - textbox "Password (min 6 characters)" [ref=e18]: Password123
      - button "Start Your Project" [ref=e19] [cursor=pointer]
    - paragraph [ref=e20]:
      - text: Already have an account?
      - link "Login" [ref=e21] [cursor=pointer]:
        - /url: /login
  - alert [ref=e22]
```