# Member Management

The user provided a future member-management requirement but did not provide a new member name, committee, role, or image. No new member was invented or added.

## Add a new member locally

Use the helper:

```bash
node scripts/add-member.mjs --name "اسم العضو" --committee "اسم اللجنة" --role "المنصب"
```

The helper appends a row to:

`private/member-credentials.csv`

It generates:

- `membership_id` using the next `NYIJO0000` number
- an 11-character password

## Excluded member

The helper refuses names matching مؤمن / Moamen / Momen / Moumen, because the project requirement excludes مؤمن completely from members, credentials, dashboard, and structure.

## Create Supabase Auth users

After adding rows locally:

```bash
node scripts/bulk-create-auth-users.mjs
```

## Security

- `private/` must stay ignored by git
- `.env.local` must stay ignored by git
- passwords are only in the local private CSV for setup
- Supabase Auth owns actual login passwords
- do not put service role keys in frontend or Netlify public variables
