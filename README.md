_This project has been created as part of the 42 curriculum by ehosta, mobenhab, sgil--de, mdourdoi, ticasali._

# ft_transcendence - Onitama

## Before launching

All secrets are stored in Vault. JWT, 2FA and database secrets are generated automatically on first launch; only the SMTP password must be provided by hand.

1. Create the secret file with the Gmail app password of `onitama.transcendance@gmail.com` (password only, no `KEY=`):

   ```sh
   mkdir -p secrets
   printf '%s' 'your-smtp-password' > secrets/smtp_password.txt
   chmod 600 secrets/smtp_password.txt
   ```

   The `secrets/` folder is git-ignored: never commit it.

2. Launch the stack:

   ```sh
   make
   ```

On startup, `vault-init` reads this file (mounted as a Docker secret at `/run/secrets/smtp_password`) and writes it to Vault at `secret/smtp`. If the file is missing, `docker compose` refuses to start; if it is empty, `vault-init` fails. To change the password, edit the file and run `make` again.

## Resources

to generate keys for 2FA and JWT: `openssl rand -hex 32`

## Algo explanation by pikachu

Pika pika ! Pikachu ! ⚡

Pika pi, pikachu pika ? Pika pika pi… pikaaa ! Pika pika, chu pika pi pika. Pi-ka-chu !

Pika ? Pika pika pi ! Pikachu pika pika… pi pika ? Chuuu… Pika pi ! Pika pika pika pikachu.

Pi pika ! Pika pika pi, pikachu pika chu. Pika ? Pika ! PIKAAA ! Pika pika pi pikachu… pika.

Chu pika pika, pi pikachu ! Pika pika pi pika pika ? Pi ! Pikachu pika pi pika. ⚡⚡

Pika pika… PIKACHUUUU ! ⚡⚡

### References

- [Online Onitama](https://onitama.app/#/)
- [Rules Onitama](http://jeuxstrategie1.free.fr/jeu_onitama/regle.pdf)
- [Alpha-Beta](https://www.geeksforgeeks.org/artificial-intelligence/alpha-beta-pruning-in-adversarial-search-algorithms/)
