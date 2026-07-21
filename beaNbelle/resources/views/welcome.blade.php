<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>BeaNBelle Branch Sales</title>

        @fonts

        @vite(['resources/css/app.css', 'resources/js/app.js'])

        <style>
            @media print {
                body * {
                    visibility: hidden;
                }

                #print-report,
                #print-report * {
                    visibility: visible;
                }

                #print-report {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    padding: 24px;
                    color: #18181b;
                    background: #ffffff;
                }

                .no-print {
                    display: none !important;
                }
            }
        </style>
    </head>
    <body class="bg-zinc-950 font-sans text-zinc-100 antialiased">
        @php
            $branches = [
                ['key' => 'main', 'name' => 'Main Branch', 'users' => '2 users', 'sales' => 'PHP 64,880', 'orders' => '312', 'status' => 'Open', 'topItem' => 'Signature Milk Tea'],
                ['key' => 'north', 'name' => 'North Branch', 'users' => '1 user', 'sales' => 'PHP 42,150', 'orders' => '208', 'status' => 'Open', 'topItem' => 'Caramel Latte'],
                ['key' => 'south', 'name' => 'South Branch', 'users' => '2 users', 'sales' => 'PHP 39,940', 'orders' => '197', 'status' => 'Open', 'topItem' => 'Chocolate Waffle'],
                ['key' => 'east', 'name' => 'East Branch', 'users' => '1 user', 'sales' => 'PHP 39,450', 'orders' => '188', 'status' => 'Closing', 'topItem' => 'Berry Cheesecake'],
            ];

            $items = [
                ['name' => 'Signature Milk Tea', 'price' => 'PHP 95', 'stock' => '84 cups', 'image' => 'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=600&q=80'],
                ['name' => 'Caramel Latte', 'price' => 'PHP 120', 'stock' => '52 cups', 'image' => 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80'],
                ['name' => 'Chocolate Waffle', 'price' => 'PHP 145', 'stock' => '31 plates', 'image' => 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80'],
                ['name' => 'Berry Cheesecake', 'price' => 'PHP 165', 'stock' => '18 slices', 'image' => 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80'],
            ];
        @endphp

        <main class="min-h-screen bg-[linear-gradient(135deg,#18181b_0%,#27272a_44%,#064e3b_100%)]">
            <section class="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 gap-6 px-4 py-4 sm:px-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:px-8">
                <aside class="no-print flex flex-col justify-between rounded-lg border border-white/10 bg-zinc-950/78 p-4 shadow-2xl shadow-black/20 backdrop-blur lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
                    <div class="space-y-6">
                        <div class="flex items-center justify-between gap-3">
                            <div>
                                <p class="text-xs font-semibold uppercase tracking-wide text-emerald-300">Store system</p>
                                <h1 class="mt-1 text-2xl font-bold tracking-normal text-white">BeaNBelle</h1>
                            </div>
                            <div class="grid size-11 place-items-center rounded-md bg-emerald-400 text-lg font-black text-zinc-950">B</div>
                        </div>

                        <nav class="grid grid-cols-2 gap-2 text-sm font-medium lg:grid-cols-1">
                            <a href="#dashboard" class="rounded-md bg-white px-3 py-2.5 text-zinc-950">Dashboard</a>
                            <a href="#branches" class="rounded-md px-3 py-2.5 text-zinc-300 hover:bg-white/10 hover:text-white">Branches</a>
                            <a href="#reports" class="rounded-md px-3 py-2.5 text-zinc-300 hover:bg-white/10 hover:text-white">Reports</a>
                            <a href="#items" class="rounded-md px-3 py-2.5 text-zinc-300 hover:bg-white/10 hover:text-white">Items</a>
                            <a href="#add-item" class="rounded-md px-3 py-2.5 text-zinc-300 hover:bg-white/10 hover:text-white">Add item</a>
                        </nav>
                    </div>

                    <form class="mt-6 space-y-3 rounded-lg border border-white/10 bg-white/[0.06] p-4" aria-label="Branch login">
                        <div>
                            <h2 class="text-base font-semibold text-white">Branch login</h2>
                            <p class="mt-1 text-xs leading-5 text-zinc-400">One or two staff accounts can be assigned to each branch.</p>
                        </div>
                        <label class="block">
                            <span class="text-xs font-medium text-zinc-300">Branch</span>
                            <select class="mt-1.5 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300">
                                @foreach ($branches as $branch)
                                    <option>{{ $branch['name'] }}</option>
                                @endforeach
                            </select>
                        </label>
                        <label class="block">
                            <span class="text-xs font-medium text-zinc-300">Username</span>
                            <input type="text" value="main_cashier_01" class="mt-1.5 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300">
                        </label>
                        <label class="block">
                            <span class="text-xs font-medium text-zinc-300">Password</span>
                            <input type="password" value="password" class="mt-1.5 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300">
                        </label>
                        <button type="button" class="w-full rounded-md bg-emerald-400 px-4 py-2.5 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-950/20 hover:bg-emerald-300">Sign in</button>
                    </form>
                </aside>

                <div class="space-y-6 py-2 lg:py-0">
                    <header id="dashboard" class="no-print rounded-lg border border-white/10 bg-white/92 p-4 text-zinc-950 shadow-2xl shadow-black/20 sm:p-6">
                        <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div class="max-w-2xl">
                                <p class="text-sm font-semibold text-emerald-700">Multi-branch sales dashboard</p>
                                <h2 class="mt-2 text-3xl font-bold leading-tight tracking-normal text-zinc-950 sm:text-4xl">Track every branch, item, picture, and sale in one friendly screen.</h2>
                                <p class="mt-3 text-base leading-7 text-zinc-600">This UI mockup is ready for the next step: database tables, branch users, uploaded item photos, PDF reports, and sales entry logic.</p>
                            </div>
                            <div class="grid min-w-0 grid-cols-2 gap-3 sm:min-w-80">
                                <div class="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                                    <p class="text-xs font-semibold uppercase tracking-wide text-zinc-500">Total sales</p>
                                    <p class="mt-2 text-3xl font-bold text-zinc-950">PHP 186,420</p>
                                </div>
                                <div class="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                                    <p class="text-xs font-semibold uppercase tracking-wide text-emerald-700">Branches</p>
                                    <p class="mt-2 text-3xl font-bold text-emerald-950">4</p>
                                </div>
                            </div>
                        </div>
                    </header>

                    <section id="branches" class="no-print grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        @foreach ($branches as $branch)
                            <article class="rounded-lg border border-white/10 bg-white p-4 text-zinc-950 shadow-xl shadow-black/10">
                                <div class="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 class="text-lg font-bold">{{ $branch['name'] }}</h3>
                                        <p class="mt-1 text-sm text-zinc-500">{{ $branch['users'] }} assigned</p>
                                    </div>
                                    <span class="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">{{ $branch['status'] }}</span>
                                </div>
                                <p class="mt-5 text-3xl font-black">{{ $branch['sales'] }}</p>
                                <div class="mt-4 flex items-center justify-between gap-3 border-t border-zinc-200 pt-3 text-sm">
                                    <span class="text-zinc-500">Today orders</span>
                                    <strong>{{ $branch['orders'] }}</strong>
                                </div>
                            </article>
                        @endforeach
                    </section>

                    <section id="reports" class="grid grid-cols-1 gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
                        <div class="no-print rounded-lg border border-white/10 bg-zinc-900 p-4 text-white shadow-xl shadow-black/10 sm:p-5">
                            <h2 class="text-xl font-bold">Print sales report</h2>
                            <p class="mt-1 text-sm leading-6 text-zinc-400">Choose the branch first, then print. In the browser print window, select Save as PDF.</p>

                            <div class="mt-5 space-y-4">
                                <label class="block">
                                    <span class="text-sm font-medium text-zinc-300">Branch to print</span>
                                    <select id="report-branch" class="mt-1.5 w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-emerald-300">
                                        <option value="all">All branches</option>
                                        @foreach ($branches as $branch)
                                            <option value="{{ $branch['key'] }}">{{ $branch['name'] }}</option>
                                        @endforeach
                                    </select>
                                </label>

                                <button type="button" id="print-report-button" class="w-full rounded-md bg-emerald-400 px-4 py-3 text-sm font-bold text-zinc-950 hover:bg-emerald-300">Print or save PDF</button>
                            </div>
                        </div>

                        <article id="print-report" class="rounded-lg border border-white/10 bg-white p-4 text-zinc-950 shadow-xl shadow-black/10 sm:p-6">
                            <div class="flex flex-col gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p class="text-xs font-bold uppercase tracking-wide text-emerald-700">BeaNBelle sales report</p>
                                    <h2 id="report-title" class="mt-2 text-2xl font-black text-zinc-950">All branches</h2>
                                    <p id="report-date" class="mt-1 text-sm text-zinc-500">Generated today</p>
                                </div>
                                <div class="rounded-lg bg-zinc-950 px-4 py-3 text-white">
                                    <p class="text-xs font-semibold uppercase tracking-wide text-zinc-400">Report sales</p>
                                    <p id="report-sales" class="mt-1 text-2xl font-black">PHP 186,420</p>
                                </div>
                            </div>

                            <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <div class="rounded-lg border border-zinc-200 p-3">
                                    <p class="text-xs font-semibold uppercase tracking-wide text-zinc-500">Orders</p>
                                    <p id="report-orders" class="mt-1 text-xl font-bold">905</p>
                                </div>
                                <div class="rounded-lg border border-zinc-200 p-3">
                                    <p class="text-xs font-semibold uppercase tracking-wide text-zinc-500">Users</p>
                                    <p id="report-users" class="mt-1 text-xl font-bold">6 users</p>
                                </div>
                                <div class="rounded-lg border border-zinc-200 p-3">
                                    <p class="text-xs font-semibold uppercase tracking-wide text-zinc-500">Status</p>
                                    <p id="report-status" class="mt-1 text-xl font-bold">Mixed</p>
                                </div>
                                <div class="rounded-lg border border-zinc-200 p-3">
                                    <p class="text-xs font-semibold uppercase tracking-wide text-zinc-500">Top item</p>
                                    <p id="report-top-item" class="mt-1 text-xl font-bold">Milk Tea</p>
                                </div>
                            </div>

                            <div class="mt-6 overflow-hidden rounded-lg border border-zinc-200">
                                <table class="w-full text-left text-sm">
                                    <thead class="bg-zinc-100 text-xs uppercase tracking-wide text-zinc-500">
                                        <tr>
                                            <th class="px-3 py-3 font-bold">Branch</th>
                                            <th class="px-3 py-3 font-bold">Sales</th>
                                            <th class="px-3 py-3 font-bold">Orders</th>
                                            <th class="px-3 py-3 font-bold">Staff</th>
                                        </tr>
                                    </thead>
                                    <tbody id="report-rows" class="divide-y divide-zinc-200">
                                        @foreach ($branches as $branch)
                                            <tr>
                                                <td class="px-3 py-3 font-semibold">{{ $branch['name'] }}</td>
                                                <td class="px-3 py-3">{{ $branch['sales'] }}</td>
                                                <td class="px-3 py-3">{{ $branch['orders'] }}</td>
                                                <td class="px-3 py-3">{{ $branch['users'] }}</td>
                                            </tr>
                                        @endforeach
                                    </tbody>
                                </table>
                            </div>
                        </article>
                    </section>

                    <section class="no-print grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                        <div id="items" class="rounded-lg border border-white/10 bg-white p-4 text-zinc-950 shadow-xl shadow-black/10 sm:p-5">
                            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 class="text-xl font-bold">Item price cards</h2>
                                    <p class="mt-1 text-sm text-zinc-500">Photos, stock, prices, and branch availability.</p>
                                </div>
                                <div class="flex gap-2">
                                    <button type="button" class="rounded-md border border-zinc-200 px-3 py-2 text-sm font-semibold hover:bg-zinc-50">All items</button>
                                    <button type="button" class="rounded-md bg-zinc-950 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800">Best sellers</button>
                                </div>
                            </div>

                            <div class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                @foreach ($items as $item)
                                    <article class="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                                        <img src="{{ $item['image'] }}" alt="{{ $item['name'] }}" class="aspect-[4/3] w-full object-cover">
                                        <div class="p-4">
                                            <div class="flex items-start justify-between gap-3">
                                                <div>
                                                    <h3 class="font-bold">{{ $item['name'] }}</h3>
                                                    <p class="mt-1 text-sm text-zinc-500">Available in all branches</p>
                                                </div>
                                                <strong class="text-lg text-emerald-700">{{ $item['price'] }}</strong>
                                            </div>
                                            <div class="mt-4 flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm">
                                                <span class="text-zinc-500">Stock</span>
                                                <span class="font-semibold">{{ $item['stock'] }}</span>
                                            </div>
                                        </div>
                                    </article>
                                @endforeach
                            </div>
                        </div>

                        <aside id="add-item" class="rounded-lg border border-white/10 bg-zinc-900 p-4 text-white shadow-xl shadow-black/10 sm:p-5">
                            <h2 class="text-xl font-bold">Add new item</h2>
                            <p class="mt-1 text-sm text-zinc-400">UI only for now: item details, price, branch, and photo upload.</p>

                            <form class="mt-5 space-y-4">
                                <label class="block">
                                    <span class="text-sm font-medium text-zinc-300">Item name</span>
                                    <input type="text" placeholder="Example: Matcha Frappe" class="mt-1.5 w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-emerald-300">
                                </label>
                                <div class="grid grid-cols-2 gap-3">
                                    <label class="block">
                                        <span class="text-sm font-medium text-zinc-300">Price</span>
                                        <input type="text" placeholder="PHP 0.00" class="mt-1.5 w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-emerald-300">
                                    </label>
                                    <label class="block">
                                        <span class="text-sm font-medium text-zinc-300">Stock</span>
                                        <input type="number" placeholder="0" class="mt-1.5 w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-emerald-300">
                                    </label>
                                </div>
                                <label class="block">
                                    <span class="text-sm font-medium text-zinc-300">Branch availability</span>
                                    <select class="mt-1.5 w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-emerald-300">
                                        <option>All branches</option>
                                        @foreach ($branches as $branch)
                                            <option>{{ $branch['name'] }} only</option>
                                        @endforeach
                                    </select>
                                </label>
                                <label class="grid cursor-pointer place-items-center rounded-lg border border-dashed border-emerald-300/50 bg-emerald-300/10 px-4 py-8 text-center">
                                    <span class="text-sm font-semibold text-emerald-200">Upload item picture</span>
                                    <span class="mt-1 text-xs text-zinc-400">PNG, JPG, or WEBP</span>
                                    <input type="file" class="sr-only">
                                </label>
                                <button type="button" class="w-full rounded-md bg-emerald-400 px-4 py-3 text-sm font-bold text-zinc-950 hover:bg-emerald-300">Create item card</button>
                            </form>
                        </aside>
                    </section>
                </div>
            </section>
        </main>

        <script>
            const reportData = {
                all: {
                    title: 'All branches',
                    sales: 'PHP 186,420',
                    orders: '905',
                    users: '6 users',
                    status: 'Mixed',
                    topItem: 'Milk Tea',
                    rows: [
                        ['Main Branch', 'PHP 64,880', '312', '2 users'],
                        ['North Branch', 'PHP 42,150', '208', '1 user'],
                        ['South Branch', 'PHP 39,940', '197', '2 users'],
                        ['East Branch', 'PHP 39,450', '188', '1 user'],
                    ],
                },
                main: {
                    title: 'Main Branch',
                    sales: 'PHP 64,880',
                    orders: '312',
                    users: '2 users',
                    status: 'Open',
                    topItem: 'Signature Milk Tea',
                    rows: [['Main Branch', 'PHP 64,880', '312', '2 users']],
                },
                north: {
                    title: 'North Branch',
                    sales: 'PHP 42,150',
                    orders: '208',
                    users: '1 user',
                    status: 'Open',
                    topItem: 'Caramel Latte',
                    rows: [['North Branch', 'PHP 42,150', '208', '1 user']],
                },
                south: {
                    title: 'South Branch',
                    sales: 'PHP 39,940',
                    orders: '197',
                    users: '2 users',
                    status: 'Open',
                    topItem: 'Chocolate Waffle',
                    rows: [['South Branch', 'PHP 39,940', '197', '2 users']],
                },
                east: {
                    title: 'East Branch',
                    sales: 'PHP 39,450',
                    orders: '188',
                    users: '1 user',
                    status: 'Closing',
                    topItem: 'Berry Cheesecake',
                    rows: [['East Branch', 'PHP 39,450', '188', '1 user']],
                },
            };

            const reportBranch = document.getElementById('report-branch');
            const reportRows = document.getElementById('report-rows');

            function setText(id, value) {
                document.getElementById(id).textContent = value;
            }

            function updateReport() {
                const report = reportData[reportBranch.value];
                setText('report-title', report.title);
                setText('report-sales', report.sales);
                setText('report-orders', report.orders);
                setText('report-users', report.users);
                setText('report-status', report.status);
                setText('report-top-item', report.topItem);
                setText('report-date', `Generated ${new Date().toLocaleDateString()}`);

                reportRows.innerHTML = report.rows.map((row) => `
                    <tr>
                        <td class="px-3 py-3 font-semibold">${row[0]}</td>
                        <td class="px-3 py-3">${row[1]}</td>
                        <td class="px-3 py-3">${row[2]}</td>
                        <td class="px-3 py-3">${row[3]}</td>
                    </tr>
                `).join('');
            }

            reportBranch.addEventListener('change', updateReport);
            document.getElementById('print-report-button').addEventListener('click', () => {
                updateReport();
                window.print();
            });

            updateReport();
        </script>
    </body>
</html>
