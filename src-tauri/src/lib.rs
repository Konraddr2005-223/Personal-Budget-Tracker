use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

// ─────────────────────────── Models ───────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub id: String,
    pub date: String,       // "YYYY-MM-DD"
    pub title: String,
    pub amount: f64,         // negative = expense, positive = income
    pub category: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionInput {
    pub date: String,
    pub title: String,
    pub amount: f64,
    pub category: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportResult {
    pub imported: usize,
    pub skipped: usize,
    pub errors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Summary {
    pub total_income: f64,
    pub total_expenses: f64,
    pub balance: f64,
    pub transaction_count: usize,
    pub categories: Vec<CategorySummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategorySummary {
    pub name: String,
    pub total: f64,
    pub count: usize,
}

// ─────────────────────── App State ────────────────────────────

#[derive(Debug, Default)]
pub struct AppState {
    transactions: Vec<Transaction>,
    next_id: u64,
}

pub struct AppStateWrapper(pub Mutex<AppState>);

// ─────────────────── Storage helpers ──────────────────────────

fn data_file_path(app: &AppHandle) -> PathBuf {
    let dir = app
        .path()
        .app_data_dir()
        .expect("failed to resolve app data dir");
    fs::create_dir_all(&dir).ok();
    dir.join("transactions.json")
}

fn load_transactions(app: &AppHandle) -> (Vec<Transaction>, u64) {
    let path = data_file_path(app);
    if !path.exists() {
        return (Vec::new(), 1);
    }
    match fs::read_to_string(&path) {
        Ok(content) => {
            let txs: Vec<Transaction> = serde_json::from_str(&content).unwrap_or_default();
            let max_id = txs
                .iter()
                .filter_map(|t| t.id.parse::<u64>().ok())
                .max()
                .unwrap_or(0);
            (txs, max_id + 1)
        }
        Err(_) => (Vec::new(), 1),
    }
}

fn save_transactions(app: &AppHandle, transactions: &[Transaction]) -> Result<(), String> {
    let path = data_file_path(app);
    let json = serde_json::to_string_pretty(transactions)
        .map_err(|e| format!("Serialization error: {}", e))?;
    fs::write(&path, json).map_err(|e| format!("Failed to write file: {}", e))
}

// ──────────────────── CSV Parsing ─────────────────────────────

/// Detect bank format from the first few lines of a CSV file
fn detect_bank_format(content: &str) -> BankFormat {
    let lower = content.to_lowercase();

    // mBank: starts with a header or has specific mBank columns
    if lower.contains("#data operacji")
        || lower.contains("#data księgowania")
        || lower.contains("mbank")
    {
        return BankFormat::MBank;
    }

    // PKO BP: typically has "Data operacji" or "Data waluty"
    if lower.contains("\"data operacji\"")
        || lower.contains("data operacji,")
        || lower.contains("pko")
    {
        return BankFormat::PkoBp;
    }

    // ING: uses semicolons, has "Data transakcji"
    if lower.contains("data transakcji")
        || lower.contains("ing bank")
        || lower.contains(";\"data transakcji\"")
    {
        return BankFormat::Ing;
    }

    // Fallback: try generic CSV with columns: date, title, amount or similar
    BankFormat::Generic
}

#[derive(Debug)]
enum BankFormat {
    MBank,
    PkoBp,
    Ing,
    Generic,
}

fn categorize_transaction(title: &str) -> String {
    let t = title.to_lowercase();

    if t.contains("wypłata")
        || t.contains("wynagrodzenie")
        || t.contains("przelew przychodzący")
        || t.contains("zwrot")
    {
        return "Przychód".to_string();
    }
    if t.contains("biedronka")
        || t.contains("lidl")
        || t.contains("żabka")
        || t.contains("zabka")
        || t.contains("auchan")
        || t.contains("carrefour")
        || t.contains("kaufland")
        || t.contains("stokrotka")
        || t.contains("netto")
        || t.contains("dino")
        || t.contains("spar")
        || t.contains("lewiatan")
    {
        return "Jedzenie".to_string();
    }
    if t.contains("allegro")
        || t.contains("amazon")
        || t.contains("media expert")
        || t.contains("rtv euro agd")
        || t.contains("pepco")
        || t.contains("action")
        || t.contains("empik")
    {
        return "Zakupy".to_string();
    }
    if t.contains("netflix")
        || t.contains("spotify")
        || t.contains("hbo")
        || t.contains("disney")
        || t.contains("kino")
        || t.contains("steam")
    {
        return "Rozrywka".to_string();
    }
    if t.contains("orlen")
        || t.contains("bolt")
        || t.contains("uber")
        || t.contains("paliwo")
        || t.contains("mpk")
        || t.contains("jakdojade")
        || t.contains("bilet")
        || t.contains("shell")
        || t.contains("bp ")
        || t.contains("circle k")
    {
        return "Transport".to_string();
    }
    if t.contains("czynsz")
        || t.contains("wynajem")
        || t.contains("kredyt mieszk")
        || t.contains("hipoteczn")
    {
        return "Mieszkanie".to_string();
    }
    if t.contains("apteka")
        || t.contains("lek ")
        || t.contains("leki")
        || t.contains("przychodnia")
        || t.contains("lekarz")
        || t.contains("szpital")
        || t.contains("dentyst")
    {
        return "Zdrowie".to_string();
    }
    if t.contains("pzu")
        || t.contains("ubezpieczeni")
        || t.contains("rachunek")
        || t.contains("energia")
        || t.contains("gaz")
        || t.contains("woda")
        || t.contains("internet")
        || t.contains("telefon")
        || t.contains("play ")
        || t.contains("orange")
        || t.contains("t-mobile")
        || t.contains("plus gsm")
    {
        return "Rachunki".to_string();
    }

    "Inne".to_string()
}

/// Parse amount strings like "1 234,56" or "-1234.56" or "1.234,56"
fn parse_amount(raw: &str) -> Option<f64> {
    let s = raw.trim().replace('\u{00a0}', ""); // remove non-breaking spaces

    // Determine decimal separator
    // Polish CSVs typically use comma as decimal separator
    // and space or period as thousands separator
    let has_comma = s.contains(',');
    let has_period = s.contains('.');

    let cleaned = if has_comma && !has_period {
        // "1 234,56" → "1234.56"
        s.replace(' ', "").replace(',', ".")
    } else if has_comma && has_period {
        // "1.234,56" → "1234.56"  (period as thousands sep)
        s.replace('.', "").replace(',', ".")
    } else {
        // "1234.56" or "-1234.56"
        s.replace(' ', "")
    };

    cleaned.parse::<f64>().ok()
}

fn parse_csv_mbank(content: &str) -> Vec<TransactionInput> {
    let mut results = Vec::new();

    // mBank CSV columns:
    // #Data operacji;#Data księgowania;#Opis operacji;#Tytuł;#Nadawca/Odbiorca;#Numer konta;#Kwota;#Saldo po operacji;
    let lines: Vec<&str> = content.lines().collect();
    let mut data_started = false;

    for line in &lines {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }

        // Skip header lines until we find the data header
        if line.starts_with("#Data operacji") || line.starts_with("\"#Data operacji\"") {
            data_started = true;
            continue;
        }

        if !data_started {
            continue;
        }

        // Stop at summary section
        if line.starts_with('#') || line.starts_with("\"#") {
            break;
        }

        let cols: Vec<&str> = line.split(';').collect();
        if cols.len() < 7 {
            continue;
        }

        let date_raw = cols[0].trim().trim_matches('"');
        let title_raw = cols[3].trim().trim_matches('"');
        let recipient = cols[4].trim().trim_matches('"');
        let amount_raw = cols[6].trim().trim_matches('"');

        let date = normalize_date(date_raw);
        let title = if !recipient.is_empty() && recipient != title_raw {
            format!("{} – {}", recipient, title_raw)
        } else {
            title_raw.to_string()
        };

        if let Some(amount) = parse_amount(amount_raw) {
            let category = categorize_transaction(&title);
            results.push(TransactionInput {
                date,
                title,
                amount,
                category,
            });
        }
    }

    results
}

fn parse_csv_pko(content: &str) -> Vec<TransactionInput> {
    let mut results = Vec::new();

    // PKO BP CSV columns (comma-separated, quoted):
    // "Data operacji","Data waluty","Typ transakcji","Kwota","Waluta","Saldo po transakcji","Opis transakcji",...
    let lines: Vec<&str> = content.lines().collect();
    let mut header_found = false;

    for line in &lines {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }

        if line.to_lowercase().contains("data operacji") {
            header_found = true;
            continue;
        }

        if !header_found {
            continue;
        }

        let cols = split_csv_line(line, ',');
        if cols.len() < 7 {
            continue;
        }

        let date_raw = cols[0].trim().trim_matches('"');
        let amount_raw = cols[3].trim().trim_matches('"');
        let title_raw = cols[6].trim().trim_matches('"');

        let date = normalize_date(date_raw);
        let title = title_raw.to_string();

        if let Some(amount) = parse_amount(amount_raw) {
            let category = categorize_transaction(&title);
            results.push(TransactionInput {
                date,
                title,
                amount,
                category,
            });
        }
    }

    results
}

fn parse_csv_ing(content: &str) -> Vec<TransactionInput> {
    let mut results = Vec::new();

    // ING CSV: semicolon-separated
    // "Data transakcji";"Data księgowania";"Dane kontrahenta";"Tytuł";"Nr rachunku";"Nazwa banku";"Szczegóły";"Nr transakcji";"Kwota transakcji (waluta rachunku)";"Waluta";"Kwota blokady/transakcji (waluta oryginalna)";"Waluta oryginalna";"Saldo po transakcji"
    let lines: Vec<&str> = content.lines().collect();
    let mut header_found = false;

    for line in &lines {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }

        if line.to_lowercase().contains("data transakcji") {
            header_found = true;
            continue;
        }

        if !header_found {
            continue;
        }

        let cols: Vec<&str> = line.split(';').collect();
        if cols.len() < 9 {
            continue;
        }

        let date_raw = cols[0].trim().trim_matches('"');
        let counterparty = cols[2].trim().trim_matches('"');
        let title_raw = cols[3].trim().trim_matches('"');
        let amount_raw = cols[8].trim().trim_matches('"');

        let date = normalize_date(date_raw);
        let title = if !counterparty.is_empty() && counterparty != title_raw {
            format!("{} – {}", counterparty, title_raw)
        } else {
            title_raw.to_string()
        };

        if let Some(amount) = parse_amount(amount_raw) {
            let category = categorize_transaction(&title);
            results.push(TransactionInput {
                date,
                title,
                amount,
                category,
            });
        }
    }

    results
}

fn parse_csv_generic(content: &str) -> Vec<TransactionInput> {
    let mut results = Vec::new();

    let separator = if content.contains(';') { ';' } else { ',' };
    let lines: Vec<&str> = content.lines().collect();

    if lines.is_empty() {
        return results;
    }

    // Skip header
    for line in lines.iter().skip(1) {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }

        let cols: Vec<&str> = if separator == ',' {
            split_csv_line(line, ',')
        } else {
            line.split(';').collect()
        };

        // Try to extract: date, title, amount (minimum 3 columns)
        if cols.len() < 3 {
            continue;
        }

        let date_raw = cols[0].trim().trim_matches('"');
        let title_raw = cols[1].trim().trim_matches('"');
        let amount_raw = cols[2].trim().trim_matches('"');

        let date = normalize_date(date_raw);
        let title = title_raw.to_string();

        if let Some(amount) = parse_amount(amount_raw) {
            let category = if cols.len() > 3 {
                let cat = cols[3].trim().trim_matches('"');
                if cat.is_empty() {
                    categorize_transaction(&title)
                } else {
                    cat.to_string()
                }
            } else {
                categorize_transaction(&title)
            };

            results.push(TransactionInput {
                date,
                title,
                amount,
                category,
            });
        }
    }

    results
}

/// Split a CSV line respecting quoted fields
fn split_csv_line(line: &str, separator: char) -> Vec<&str> {
    // Simple approach – handles most cases
    // For a production parser you'd use the `csv` crate
    let mut fields = Vec::new();
    let mut in_quotes = false;
    let mut start = 0;

    for (i, ch) in line.char_indices() {
        if ch == '"' {
            in_quotes = !in_quotes;
        } else if ch == separator && !in_quotes {
            fields.push(&line[start..i]);
            start = i + 1;
        }
    }
    fields.push(&line[start..]);
    fields
}

/// Normalize date formats to YYYY-MM-DD
fn normalize_date(raw: &str) -> String {
    let raw = raw.trim();

    // Already YYYY-MM-DD
    if raw.len() == 10 && raw.chars().nth(4) == Some('-') {
        return raw.to_string();
    }

    // DD-MM-YYYY or DD.MM.YYYY or DD/MM/YYYY
    let parts: Vec<&str> = raw.split(|c| c == '-' || c == '.' || c == '/').collect();
    if parts.len() == 3 {
        let (a, b, c) = (parts[0], parts[1], parts[2]);
        if a.len() == 4 {
            return format!("{}-{}-{}", a, b, c);
        }
        if c.len() == 4 {
            return format!("{}-{}-{}", c, b, a);
        }
    }

    raw.to_string()
}

// ─────────────────── Tauri Commands ───────────────────────────

#[tauri::command]
fn get_transactions(state: tauri::State<'_, AppStateWrapper>) -> Vec<Transaction> {
    let guard = state.0.lock().unwrap();
    guard.transactions.clone()
}

#[tauri::command]
fn add_transaction(
    app: AppHandle,
    state: tauri::State<'_, AppStateWrapper>,
    input: TransactionInput,
) -> Result<Transaction, String> {
    let mut guard = state.0.lock().unwrap();
    let id = guard.next_id;
    guard.next_id += 1;

    let tx = Transaction {
        id: id.to_string(),
        date: input.date,
        title: input.title,
        amount: input.amount,
        category: input.category,
    };

    guard.transactions.push(tx.clone());
    save_transactions(&app, &guard.transactions)?;

    Ok(tx)
}

#[tauri::command]
fn update_transaction(
    app: AppHandle,
    state: tauri::State<'_, AppStateWrapper>,
    id: String,
    input: TransactionInput,
) -> Result<Transaction, String> {
    let mut guard = state.0.lock().unwrap();

    let tx = guard
        .transactions
        .iter_mut()
        .find(|t| t.id == id)
        .ok_or_else(|| format!("Transaction with id '{}' not found", id))?;

    tx.date = input.date;
    tx.title = input.title;
    tx.amount = input.amount;
    tx.category = input.category;

    let updated = tx.clone();
    save_transactions(&app, &guard.transactions)?;

    Ok(updated)
}

#[tauri::command]
fn delete_transaction(
    app: AppHandle,
    state: tauri::State<'_, AppStateWrapper>,
    id: String,
) -> Result<(), String> {
    let mut guard = state.0.lock().unwrap();
    let before = guard.transactions.len();
    guard.transactions.retain(|t| t.id != id);

    if guard.transactions.len() == before {
        return Err(format!("Transaction with id '{}' not found", id));
    }

    save_transactions(&app, &guard.transactions)?;
    Ok(())
}

#[tauri::command]
fn delete_all_transactions(
    app: AppHandle,
    state: tauri::State<'_, AppStateWrapper>,
) -> Result<(), String> {
    let mut guard = state.0.lock().unwrap();
    guard.transactions.clear();
    save_transactions(&app, &guard.transactions)?;
    Ok(())
}

#[tauri::command]
fn import_csv(
    app: AppHandle,
    state: tauri::State<'_, AppStateWrapper>,
    path: String,
) -> Result<ImportResult, String> {
    let content =
        fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))?;

    let format = detect_bank_format(&content);
    let parsed = match format {
        BankFormat::MBank => parse_csv_mbank(&content),
        BankFormat::PkoBp => parse_csv_pko(&content),
        BankFormat::Ing => parse_csv_ing(&content),
        BankFormat::Generic => parse_csv_generic(&content),
    };

    let mut guard = state.0.lock().unwrap();

    let mut imported = 0;
    let mut skipped = 0;
    let errors = Vec::new();

    for input in parsed {
        // Simple duplicate detection: same date + title + amount
        let is_dup = guard.transactions.iter().any(|t| {
            t.date == input.date
                && t.title == input.title
                && (t.amount - input.amount).abs() < 0.01
        });

        if is_dup {
            skipped += 1;
            continue;
        }

        let id = guard.next_id;
        guard.next_id += 1;

        guard.transactions.push(Transaction {
            id: id.to_string(),
            date: input.date,
            title: input.title,
            amount: input.amount,
            category: input.category,
        });

        imported += 1;
    }

    // Sort by date descending
    guard
        .transactions
        .sort_by(|a, b| b.date.cmp(&a.date).then_with(|| b.id.cmp(&a.id)));

    save_transactions(&app, &guard.transactions)?;

    Ok(ImportResult {
        imported,
        skipped,
        errors,
    })
}

#[tauri::command]
fn get_summary(state: tauri::State<'_, AppStateWrapper>) -> Summary {
    let guard = state.0.lock().unwrap();

    let total_income: f64 = guard
        .transactions
        .iter()
        .filter(|t| t.amount >= 0.0)
        .map(|t| t.amount)
        .sum();

    let total_expenses: f64 = guard
        .transactions
        .iter()
        .filter(|t| t.amount < 0.0)
        .map(|t| t.amount)
        .sum();

    let balance = total_income + total_expenses;

    let mut cat_map: std::collections::HashMap<String, (f64, usize)> =
        std::collections::HashMap::new();
    for t in &guard.transactions {
        let entry = cat_map.entry(t.category.clone()).or_insert((0.0, 0));
        entry.0 += t.amount.abs();
        entry.1 += 1;
    }

    let mut categories: Vec<CategorySummary> = cat_map
        .into_iter()
        .map(|(name, (total, count))| CategorySummary { name, total, count })
        .collect();
    categories.sort_by(|a, b| b.total.partial_cmp(&a.total).unwrap());

    Summary {
        total_income,
        total_expenses,
        balance,
        transaction_count: guard.transactions.len(),
        categories,
    }
}

#[tauri::command]
fn get_export_data(state: tauri::State<'_, AppStateWrapper>) -> String {
    let guard = state.0.lock().unwrap();

    let mut csv = String::from("Data;Tytuł;Kwota;Kategoria\n");
    for t in &guard.transactions {
        csv.push_str(&format!(
            "{};{};{:.2};{}\n",
            t.date, t.title, t.amount, t.category
        ));
    }

    csv
}

#[tauri::command]
fn write_export_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| format!("Failed to write export file: {}", e))
}

// ────────────────────── App entry ─────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Load persisted transactions on startup
            let handle = app.handle().clone();
            let (txs, next_id) = load_transactions(&handle);

            app.manage(AppStateWrapper(Mutex::new(AppState {
                transactions: txs,
                next_id,
            })));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_transactions,
            add_transaction,
            update_transaction,
            delete_transaction,
            delete_all_transactions,
            import_csv,
            get_summary,
            get_export_data,
            write_export_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
