# Polityka bezpieczeństwa

Dbamy o bezpieczeństwo i prywatność użytkowników. Jeśli uważasz, że znalazłeś(aś) podatność lub problem z ochroną danych, zgłoś go w sposób odpowiedzialny.

## Wspierane wersje

Wspieramy najnowszy commit na gałęzi `main`. Starsze gałęzie utrzymywane są w modelu best-effort.

## Zgłaszanie podatności

- Obecnie najlepiej przez Issues na GitHubie
- Temat: [SECURITY] Krótki opis
- Załącz kroki reprodukcji, dotknięte komponenty oraz istotne logi/PoC. Prosimy nie przesyłać danych osobowych.
- Potwierdzamy otrzymanie w ciągu 72 godzin i, po weryfikacji, podajemy szacowany termin poprawki.

## Zakres i wytyczne

- Nie wykonuj działań mogących zaszkodzić użytkownikom lub integralności danych (np. DoS, masowe scrapowanie)
- Unikaj dostępu do danych, do których nie masz uprawnień
- Szanuj limity zapytań i ramy prawne
- Używaj kont testowych, gdy to możliwe

## Skoordynowane ujawnianie

Stosujemy odpowiedzialne ujawnianie. Po naprawie i wdrożeniu możemy opublikować krótki komunikat i podziękować zgłaszającym (za zgodą).

## Ochrona danych

- Polityki RLS zgodne z zasadą najmniejszych uprawnień
- Publiczne buckety tylko do odczytu; zapisy ograniczone do własnych prefiksów użytkownika
- OAuth i zarządzanie sesjami przez Supabase
- Opcjonalne MFA/2FA w planie

Dziękujemy za dbanie o bezpieczeństwo naszej społeczności.
