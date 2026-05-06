---
title: brief_alternate Assignment
date: "2024.01.01 0:00"
tags:
  - - Python
  - - pandas
abbrlink: dbbd7d58
docId: one7va4e0hvbq1eqhm6ww2kd
---

# topic

[brief_alternate.pdf](..%2Fassets%2Fdocuments%2Fbrief_alternate.pdf)
[superstore_transaction.csv](..%2Fassets%2Fdocuments%2Fsuperstore_transaction.csv)

# Thought：

Self -studypandasData processing，Before`import csv`Make much more useful。

What the knowledge point needs to be remembered is：

1. df["Name"] You can directly determine the first line as the name listed，并且返回一个只包含Nameof列表。
2. idxmax()Return to the maximum valueindex,max()Maximum meal
3. `.loc `The function is pandas An important function in it，Used to select and locate data in the data box。It allows you to choose some lines and columns，To make it DataFrame or Series Back to form。
   By using the line label and column label as the index，You can perform the following operations in the data box：
   .Choose a single line of data
   .Choose multi -line data
   .Select single -column data
   .Select multiple columns of data
   grammar： `df.loc[row_indexer, column_indexer]`
   in，row_indexer Is the label to choose a line，column_indexer Is the label of the column to be selected。
4. unique()Return without duplicationvalueofnumbercount。
   code show as below：

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
r = requests.request("GET", url, headers=headers, data=payload)  # responseAPI
# 查看response结果
print("Status code:", r.status_code)
# Back content isjsonFormat file
# WillAPIresponse存储在一个变量中
# json()Function only decodesjsonFormat return
response_dict = r.json()
# print(response_dict)
# process result  获得response字典
# 探索有关仓库of信息  response_dict字典of嵌套
# print(response_dict['info']['rate'])

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
