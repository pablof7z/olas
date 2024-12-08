<script lang="ts">
	import Logo from '$lib/components/icons/Logo.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Form from '$lib/components/ui/form';
	import { superForm } from 'sveltekit-superforms';
	import { Loader } from 'lucide-svelte';
	const form = superForm({}, {
	});

	const { form: formData, enhance, delayed } = form;
</script>

<Card.Root class="mx-auto w-full max-w-sm">
	<Card.Header>
		<div class="mx-auto w-fit">
			<Logo />
		</div>
	</Card.Header>
	
		<form method="POST" use:enhance class="grid gap-4">
			<Card.Content>
				
			<Form.Field {form} name="email">
				<Form.Control let:attrs>
					<Input {...attrs} placeholder="email" bind:value={$formData.email} />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			<div class="mt-4 text-center text-sm">
			<Form.Field {form} name="password">
				<Form.Control let:attrs>
					<Input
						{...attrs}
						type="password"
						placeholder="password"
						bind:value={$formData.password}
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		
		
		</div>
		<div class="mt-4 text-center text-sm">
			Don't have an account?,
			<a href="/register" class="underline"> Register </a>
		</div>
	</Card.Content>
		<Card.Footer>
			<Button type="submit" class="w-full bg-blue-500 hover:bg-blue-600">
				{#if $delayed}
					<Loader class="size-4 animate-spin" />
				{:else}
					Sign In
				{/if}
			</Button>
		</Card.Footer>
	</form>
</Card.Root>
