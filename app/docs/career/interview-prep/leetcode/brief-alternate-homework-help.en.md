---
title: "Brief Alternate Assignment Help"
date: "2024.01.01 0:00"
tags:
  - - Python
  - - pandas
abbrlink: dbbd7d58
docId: one7va4e0hvbq1eqhm6ww2kd
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Problem

[brief_alternate.pdf](..%2Fassets%2Fdocuments%2Fbrief_alternate.pdf)
[superstore_transaction.csv](..%2Fassets%2Fdocuments%2Fsuperstore_transaction.csv)

# Approach

Self-taught `pandas` data processing — much more powerful than using `import csv` from before.

Key points to remember:

1. `df["Name"]` automatically treats the first row as column names and returns a Series containing only that column.
2. `idxmax()` returns the index of the maximum value; `max()` returns the maximum value itself.
3. `.loc` is an important pandas function used to select and locate data in a DataFrame. It allows you to choose rows and columns using label-based indexing:
   - Select a single row
   - Select multiple rows
   - Select a single column
   - Select multiple columns

   Syntax: `df.loc[row_indexer, column_indexer]`

4. `unique()` returns the count of unique values without duplicates.

[superstore](..%2Fassets%2Fdocuments%2Fsuperstore)

```python s_p
# Import pandas library as pd
import pandas as pd

# Read CSV file named 'superstore_transaction.csv' and store it in a dataframe named 'df'
df = pd.read_csv("superstore_transaction.csv")

# Remove "$" and "," from the values in the 'Profit' column and convert it to integer
df["Profit"] = df["Profit"].str.replace('$', "").str.replace(",", "").astype(int)

# Remove "$" and "," from the values in the 'Sales' column and convert it to integer
df["Sales"] = df["Sales"].str.replace('$', "").str.replace(",", "").astype(int)

# Get the index of the row with the maximum value in the 'Profit' column and store it in 'col_max_profit'
col_max_profit = df["Profit"].idxmax()
# Get the index of the row with the maximum value in the 'Sales' column and store it in 'col_max_sales'
col_max_sales = df["Sales"].idxmax()

# Store the details of the transaction with highest sales
highest_sales_info = [
    "=========================\n"
    "HIGHEST SALES TRANSACTION\n"
    "=========================\n",
    "Category: {}\n".format(df.loc[col_max_sales, "Category"]),
    "Customer Name: {}\n".format(df.loc[col_max_sales, "Customer Name"]),
    "Product Name: {}\n".format(df.loc[col_max_sales, "Product Name"]),
    "Segment: {}\n".format(df.loc[col_max_sales, "Segment"]),
    "Sub-Category: {}\n".format(df.loc[col_max_sales, "Sub-Category"]),
    "Profit: {}\n".format(df["Sales"].max()),
]

# Store the details of the transaction with the highest profit
highest_profit_info = [
    "==========================\n"
    "HIGHEST PROFIT TRANSACTION\n"
    "==========================\n",
    "Category: {}\n".format(df.loc[col_max_profit, "Category"]),
    "Customer Name: {}\n".format(df.loc[col_max_profit, "Customer Name"]),
    "Product Name: {}\n".format(df.loc[col_max_profit, "Product Name"]),
    "Segment: {}\n".format(df.loc[col_max_profit, "Segment"]),
    "Sub-Category: {}\n".format(df.loc[col_max_profit, "Sub-Category"]),
    "Profit: {}\n".format(df["Profit"].max()),
]

# Open a file named 'summary_report.txt' in 'append' mode and store it in 'file'
with open("summary_report.txt", "a") as file:
    # Write the 'highest_sales_info' details to the file
    file.write(''.join(highest_sales_info))
    file.write(''.join(highest_profit_info))

```

```python api
import requests

url = ""
payload = {}
headers = {
    "apikey": ""
}
r = requests.request("GET", url, headers=headers, data=payload)  # API response
# view response result
print("Status code:", r.status_code)
# return content is in JSON format
# store the API response in a variable
# json() only decodes JSON-format returns
response_dict = r.json()
# process result and get response dictionary
# explore repository information — nested response_dict

f = open("summary_report.txt", "w")
head = [
    "=================================================\n"
    "SINGAPORE TO US DOLLAR EXCHANGE RATE IN REAL TIME\n"
    "=================================================\n"
]
f.writelines(head)
f.writelines([str(response_dict['info']['rate'])+"\n"])
f.close()
print("over")

```

```python customers
import pandas as pd

df = pd.read_csv("superstore_transaction.csv")
highest_sales_info = [
    "====================\n"
    "SUPERSTORE CUSTOMERS\n"
    "====================\n",
    "TOTAL: {}\n".format(df["Customer Name"].nunique(), "Category"),
]
with open("summary_report.txt", "a") as file:
    file.writelines(highest_sales_info)

```
